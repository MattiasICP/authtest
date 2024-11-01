// src/auth.js

import { AuthClient } from "@dfinity/auth-client";

/**
 * Initialize that shit
 *
 * @returns {AuthClient} - The initialized AuthClient instance.
 */
export const initAuthClient = async () => {
  const authClient = await AuthClient.create();
  return authClient;
};

/**
 * II login
 *
 * @param {AuthClient} authClient - The AuthClient instance.
 */
export const login = async (authClient) => {
  await authClient.login({
    identityProvider: "https://identity.ic0.app/#authorize",
    onSuccess: () => {
      window.location.reload();
    },
  });
};

/**
 * Logs out
 *
 * @param {AuthClient} authClient - The AuthClient instance.
 */
export const logout = async (authClient) => {
  await authClient.logout();
  window.location.reload();
};