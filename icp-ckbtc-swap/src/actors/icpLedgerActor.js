// src/actors/icpLedgerActor.js
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory, canisterId } from "../candid/icp_ledger.did.js";

export const createIcpLedgerActor = (identity) => {
  const agent = new HttpAgent({ identity, host: "https://ic0.app" });
  
  if (process.env.NODE_ENV !== "production") {
    agent.fetchRootKey().catch((err) => {
      console.warn("Unable to fetch root key:", err);
    });
  }

  const fixStuff = (data) => {
    const processValue = (val) => {
      if (typeof val === 'object' && val !== null) {
        return Object.fromEntries(
          Object.entries(val).map(([k, v]) => [k, processValue(v)])
        );
      }
      if (Array.isArray(val)) {
        return val.map(processValue);
      }
      if (typeof val === 'bigint') {
        return Number(val);
      }
      return val;
    };

    return processValue(data);
  };

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: Principal.fromText(canisterId),
    callOptions: {
      transforms: {
        _b: fixStuff
      }
    }
  });
};