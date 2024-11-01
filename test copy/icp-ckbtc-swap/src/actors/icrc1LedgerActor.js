// src/actors/icrc1LedgerActor.js

import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory, canisterId } from "../candid/icp_token.did.js"; // Use appropriate Candid interface

/**
 * Creates an actor 
 *
 * @param {Identity} identity - The user's identity.
 * @param {Principal} canisterId - The canister ID of the ledger
 * @returns {ActorSubclass} - The ICRC1 Ledger actor. //the shit below is misnamed, leftover from icrc1 test
 */
export const createIcrc1LedgerActor = (identity, canisterId) => {
  const agent = new HttpAgent({ identity, host: "https://ic0.app" });

  // Fetch root key for certificate validation during development
  if (process.env.NODE_ENV !== "production") {
    agent.fetchRootKey().catch((err) => {
      console.warn("Unable to fetch root key:", err);
    });
  }

  const icrc1LedgerActor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });

  return icrc1LedgerActor;
};