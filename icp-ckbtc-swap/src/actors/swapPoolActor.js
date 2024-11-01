// src/actors/swapPoolActor.js

import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory, canisterId } from "../candid/swap_pool.did.js";

/**
 * Creates an actor to interact with the SwapPool canister.
 *
 * @param {Identity} identity - The user's identity.
 * @returns {ActorSubclass} - The SwapPool actor.
 */
export const createSwapPoolActor = (identity) => {
  const agent = new HttpAgent({ identity, host: "https://ic0.app" });

  // Fetch root key for certificate validation during development
  if (process.env.NODE_ENV !== "production") {
    agent.fetchRootKey().catch((err) => {
      console.warn("Unable to fetch root key:", err);
    });
  }

  const swapPoolActor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });

  return swapPoolActor;
};