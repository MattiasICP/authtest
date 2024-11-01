// src/SwapComponent.js
import React, { useState } from "react";
import { createSwapPoolActor } from "./actors/swapPoolActor";
import { createIcpLedgerActor } from "./actors/icpLedgerActor";
import { Principal } from "@dfinity/principal";

function SwapComponent({ authClient, principal }) {
  const [amountIn, setAmountIn] = useState("");
  const [quoteAmount, setQuoteAmount] = useState(null);
  const [message, setMessage] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  const swapPoolCanisterId = "xmiu5-jqaaa-aaaag-qbz7q-cai";

  const toE8s = (amount) => {
    return BigInt(Math.floor(Number(amount) * 1e8));
  };

  const getQuote = async () => {
    if (!amountIn || isNaN(amountIn) || Number(amountIn) <= 0) {
      setMessage("Please enter a valid amount of ICP.");
      return;
    }

    setMessage("Fetching quote...");
    const swapPoolActor = createSwapPoolActor(authClient.getIdentity());

    const swapArgs = {
      zeroForOne: false,
      amountIn: toE8s(amountIn).toString(),
      amountOutMinimum: "0",
    };

    try {
      const result = await swapPoolActor.quote(swapArgs);
      if ("ok" in result) {
        setQuoteAmount(result.ok);
        setMessage(
          `Quote fetched: You will receive approximately ${(Number(result.ok) / 1e8).toFixed(8)} ckBTC.`
        );
      } else {
        setMessage(`Quote error: ${JSON.stringify(result.err)}`);
      }
    } catch (error) {
      setMessage(`Quote error: ${error.message}`);
    }
  };

  const approveSwapPool = async (allowance) => {
    setMessage("Approving SwapPool to spend ICP...");
    const icpLedgerActor = createIcpLedgerActor(authClient.getIdentity());

    try {
      const approveArgs = {
      fee: [10000n], // nat as bigint
      memo: [], 
      from_subaccount: [], 
      created_at_time: [], 
      amount: allowance, // Keep as bigint
      expected_allowance: [], 
      expires_at: [], 
      spender: {
        owner: Principal.fromText(swapPoolCanisterId),
        subaccount: [], 
      },
    };

      console.log("Approve args:", approveArgs);

      const result = await icpLedgerActor.icrc2_approve(approveArgs);
      if ("Ok" in result) {
        setMessage("Approval successful.");
        return true;
      } else {
        setMessage(`Approval error: ${JSON.stringify(result.Err)}`);
        return false;
      }
    } catch (error) {
      setMessage(`Approval error: ${error.message}`);
      return false;
    }
  };

  const depositIntoSwapPool = async () => {
    setMessage("Depositing ICP into SwapPool...");
    const swapPoolActor = createSwapPoolActor(authClient.getIdentity());

    const depositArgs = {
      token: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"),
      amount: toE8s(amountIn).toString(),
      fee: [10000],
    };

    try {
      const result = await swapPoolActor.depositFrom(depositArgs);
      if ("ok" in result) {
        setMessage("Deposit successful.");
        return true;
      } else {
        setMessage(`Deposit error: ${JSON.stringify(result.err)}`);
        return false;
      }
    } catch (error) {
      setMessage(`Deposit error: ${error.message}`);
      return false;
    }
  };

  const performSwap = async () => {
    setMessage("Performing swap...");
    const swapPoolActor = createSwapPoolActor(authClient.getIdentity());

    const amountInE8s = toE8s(amountIn);
    const amountOutMinimum = BigInt(Math.floor(Number(quoteAmount) * 0.85));

    const swapArgs = {
      zeroForOne: false,
      amountIn: amountInE8s.toString(),
      amountOutMinimum: amountOutMinimum.toString(),
    };

    try {
      const result = await swapPoolActor.swap(swapArgs);
      if ("ok" in result) {
        setMessage(
          `Swap successful. Received ${(Number(result.ok) / 1e8).toFixed(8)} ckBTC.`
        );
        return result.ok;
      } else {
        setMessage(`Swap error: ${JSON.stringify(result.err)}`);
        return null;
      }
    } catch (error) {
      setMessage(`Swap error: ${error.message}`);
      return null;
    }
  };

  const withdrawFromSwapPool = async (amountOut) => {
    setMessage("Withdrawing ckBTC from SwapPool...");
    const swapPoolActor = createSwapPoolActor(authClient.getIdentity());

    const withdrawArgs = {
      token: Principal.fromText("mxzaz-hqaaa-aaaar-qaada-cai"),
      amount: amountOut.toString(),
      fee: [10],
    };

    try {
      const result = await swapPoolActor.withdraw(withdrawArgs);
      if ("ok" in result) {
        setMessage("Withdrawal successful.");
        return true;
      } else {
        setMessage(`Withdrawal error: ${JSON.stringify(result.err)}`);
        return false;
      }
    } catch (error) {
      setMessage(`Withdrawal error: ${error.message}`);
      return false;
    }
  };

  const handleSwap = async () => {
    if (!amountIn || isNaN(amountIn) || Number(amountIn) <= 0) {
      setMessage("Please enter a valid amount of ICP.");
      return;
    }

    if (!quoteAmount) {
      setMessage("Please fetch a quote before swapping.");
      return;
    }

    setIsSwapping(true);
    setMessage("Starting swap process...");

    const amountInE8s = toE8s(amountIn);

    // Step 1: Approve SwapPool to spend ICP
    const approvalSuccess = await approveSwapPool(amountInE8s);
    if (!approvalSuccess) {
      setIsSwapping(false);
      return;
    }

    // Step 2: Deposit ICP into SwapPool
    const depositSuccess = await depositIntoSwapPool();
    if (!depositSuccess) {
      setIsSwapping(false);
      return;
    }

    // Step 3: Perform the Swap
    const swapResult = await performSwap();
    if (!swapResult) {
      setIsSwapping(false);
      return;
    }

    // Step 4: Withdraw ckBTC
    const withdrawalSuccess = await withdrawFromSwapPool(swapResult);
    if (!withdrawalSuccess) {
      setIsSwapping(false);
      return;
    }

    setMessage("Swap completed successfully!");
    setIsSwapping(false);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Swap ICP for ckBTC</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Amount of ICP:
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="e.g., 0.1"
            className="w-full p-2 mt-1 border rounded"
          />
        </label>
      </div>
      <div className="mb-4">
        <button
          onClick={getQuote}
          disabled={isSwapping}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Get Quote
        </button>
      </div>
      {quoteAmount && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <p>
            <strong>Estimated ckBTC:</strong>{" "}
            {(Number(quoteAmount) / 1e8).toFixed(8)} ckBTC
          </p>
        </div>
      )}
      <div className="mb-4">
        <button
          onClick={handleSwap}
          disabled={isSwapping}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isSwapping ? "Swapping..." : "Swap"}
        </button>
      </div>
      {message && (
        <div className="mt-4 p-4 border rounded">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}

export default SwapComponent;