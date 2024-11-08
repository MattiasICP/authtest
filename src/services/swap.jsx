import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { CANISTER_IDS, TOKEN_CONFIG } from "../constants/canisters";
import { authService } from "./auth";
import { swapInterface } from "../declarations/swap";
import { icpInterface } from "../declarations/icp";
import { ckbtcInterface } from "../declarations/ckbtc";
import { 
  formatAmount, 
  parseAmount, 
  calculateMinimumReceived,
  getDefaultAccount,
  principalToAccountIdentifier
} from "../utils/format";

const NNS_PRINCIPAL_ID = 'a67db0e47ed7a0ade100055fe6e5cef40025a2cbaeadcfc1cbd06d61ac82b04e';

class SwapService {
  constructor() {
    this.swapActor = null;
    this.icpActor = null;
    this.ckBTCActor = null;
    this.agent = null;
  }

  async init() {
    if (!this.agent) {
      const identity = await authService.getIdentity();
      this.agent = new HttpAgent({ 
        identity,
        host: 'https://icp0.io'
      });
    }

    if (!this.swapActor) {
      this.swapActor = Actor.createActor(swapInterface, {
        agent: this.agent,
        canisterId: CANISTER_IDS.SWAP_POOL,
      });
    }

    if (!this.icpActor) {
      this.icpActor = Actor.createActor(icpInterface, {
        agent: this.agent,
        canisterId: CANISTER_IDS.ICP_LEDGER,
      });
    }

    if (!this.ckBTCActor) {
      this.ckBTCActor = Actor.createActor(ckbtcInterface, {
        agent: this.agent,
        canisterId: CANISTER_IDS.CKBTC_LEDGER,
      });
    }
  }

  async checkBalance(token) {
    if (!this.agent) {
      await this.init();
    }

    const identity = await authService.getIdentity();
    const principal = identity.getPrincipal();
    console.log('Checking balance for principal:', principal.toString());

    try {
      if (token === 'ICP') {
        // Convert principal to Uint8Array identifier
        const accountBytes = principalToAccountIdentifier(NNS_PRINCIPAL_ID, undefined);
        console.log('Account identifier as Uint8Array:', accountBytes);

        // Call account_balance with Uint8Array only
        const balance = await this.icpActor.account_balance({ account: accountBytes });
        console.log('Raw ICP Balance:', balance.e8s.toString());
        return BigInt(balance.e8s);
      } else {
        const account = getDefaultAccount(principal);
        const balance = await this.ckBTCActor.icrc1_balance_of(account);
        console.log('Raw ckBTC Balance:', balance.toString());
        return balance;
      }
    } catch (error) {
      console.error('Balance check error:', error);
      throw new Error('Failed to check ' + token + ' balance: ' + error.message);
    }
  }

  async getQuote(amountIn, zeroForOne) {
    try {
      if (!this.swapActor) {
        await this.init();
      }

      const result = await this.swapActor.quote({
        zeroForOne,
        amountIn: amountIn.toString(),
        amountOutMinimum: '0',
      });

      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err.InternalError || 'Failed to get quote');
      }
    } catch (error) {
      console.error('Quote error:', error);
      throw error;
    }
  }

  async approveSpending(token, amount) {
    if (!this.agent) {
      await this.init();
    }

    const actor = token === 'ICP' ? this.icpActor : this.ckBTCActor;
    const spenderPrincipal = Principal.fromText(CANISTER_IDS.SWAP_POOL);
    
    try {
      // Check balance first
      const balance = await this.checkBalance(token);
      const fee = BigInt(token === 'ICP' ? TOKEN_CONFIG.ICP.fee : TOKEN_CONFIG.CKBTC.fee);
      const requiredAmount = BigInt(amount) + fee;
      
      console.log(`Required amount: ${requiredAmount.toString()} in base units`);
      console.log(`Available balance: ${balance.toString()} in base units`);

      if (balance < requiredAmount) {
        throw new Error(
          `Insufficient balance. Required: ${requiredAmount.toString()} ` +
          `Available: ${balance.toString()} ${token}`
        );
      }

      // Format according to ICRC2 ApproveArgs spec
      const approveArgs = {
        amount: BigInt(amount),
        spender: {
          owner: spenderPrincipal,
          subaccount: []
        },
        fee: [fee],
        from_subaccount: [],
        memo: [],
        created_at_time: [],
        expected_allowance: [],
        expires_at: []
      };

      // Log safe approval arguments
      console.log('Sending approve with args:', {
        ...approveArgs,
        amount: approveArgs.amount.toString(),
        fee: approveArgs.fee.map(f => f.toString())
      });
      
      const result = await actor.icrc2_approve(approveArgs);

      if ('Ok' in result) {
        return result.Ok;
      } else if ('Err' in result) {
        const error = result.Err;
        if (error.GenericError) {
          throw new Error(error.GenericError.message);
        } else if (error.BadFee) {
          throw new Error('Incorrect fee for approval: ' + JSON.stringify(error.BadFee));
        } else if (error.InsufficientFunds) {
          throw new Error(
            `Insufficient funds for approval. ` +
            `Required: ${amount.toString()} ` +
            `Available: ${balance.toString()} ${token}`
          );
        } else {
          throw new Error('Approval failed: ' + JSON.stringify(error));
        }
      }
      throw new Error('Unexpected approval response format');
    } catch (error) {
      console.error('Approve error:', error);
      throw error;
    }
  }

  async executeSwap(amountIn, minAmountOut, zeroForOne) {
    if (!this.swapActor) {
      await this.init();
    }

    try {
      // First approve the spending
      const token = zeroForOne ? 'CKBTC' : 'ICP';
      await this.approveSpending(token, amountIn);

      console.log('Deposit step - Amount:', amountIn.toString());
      // Then deposit the tokens
      const depositResult = await this.swapActor.depositFrom({
        token: zeroForOne ? TOKEN_CONFIG.CKBTC.canisterId : TOKEN_CONFIG.ICP.canisterId,
        amount: BigInt(amountIn),
        fee: zeroForOne ? TOKEN_CONFIG.CKBTC.fee : TOKEN_CONFIG.ICP.fee,
      });

      if ('err' in depositResult) {
        throw new Error('Deposit failed: ' + JSON.stringify(depositResult.err));
      }

      console.log('Swap step - Amount:', amountIn.toString());
      // Execute the swap
      const swapResult = await this.swapActor.swap({
        zeroForOne,
        amountIn: amountIn.toString(),
        amountOutMinimum: minAmountOut.toString(),
      });

      if ('err' in swapResult) {
        throw new Error('Swap failed: ' + JSON.stringify(swapResult.err));
      }

      console.log('Withdraw step - Amount:', swapResult.ok.toString());
      // Withdraw the received tokens
      const withdrawResult = await this.swapActor.withdraw({
        token: zeroForOne ? TOKEN_CONFIG.ICP.canisterId : TOKEN_CONFIG.CKBTC.canisterId,
        amount: BigInt(swapResult.ok),
        fee: zeroForOne ? TOKEN_CONFIG.ICP.fee : TOKEN_CONFIG.CKBTC.fee,
      });

      if ('err' in withdrawResult) {
        throw new Error('Withdraw failed: ' + JSON.stringify(withdrawResult.err));
      }

      return swapResult.ok;
    } catch (error) {
      console.error('Swap error:', error);
      throw error;
    }
  }
}

export const swapService = new SwapService();