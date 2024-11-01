// src/candid/swap_pool.did.js

export const idlFactory = ({ IDL }) => {
  // potentially important shit below
  const SwapArgs = IDL.Record({
    zeroForOne: IDL.Bool,
    amountIn: IDL.Text, // Assuming BigInt is passed as string
    amountOutMinimum: IDL.Text, // bigint passed as string, this shit is wrong I think
  });

  const SwapResult = IDL.Variant({
    ok: IDL.Nat,
    err: IDL.Text, // Simplified error type
  });

  const DepositFromArgs = IDL.Record({
    token: IDL.Text,
    amount: IDL.Nat,
    fee: IDL.Nat,
  });

  const DepositResult = IDL.Variant({
    ok: IDL.Bool,
    err: IDL.Text,
  });

  const WithdrawArgs = IDL.Record({
    token: IDL.Text,
    amount: IDL.Nat,
    fee: IDL.Nat,
  });

  const WithdrawResult = IDL.Variant({
    ok: IDL.Bool,
    err: IDL.Text, // Simplified error type
  });

  const QuoteResult = IDL.Variant({
    ok: IDL.Nat,
    err: IDL.Text, // Simplified error type
  });

  const SwapPool = IDL.Service({
    quote: IDL.Func([SwapArgs], [QuoteResult], ["query"]),
    depositFrom: IDL.Func([DepositFromArgs], [DepositResult], []),
    swap: IDL.Func([SwapArgs], [SwapResult], []),
    withdraw: IDL.Func([WithdrawArgs], [WithdrawResult], []),
  });

  return SwapPool;
};

export const canisterId = "xmiu5-jqaaa-aaaag-qbz7q-cai"; // SwapPool Canister ID