// src/utils/utils.js

import { Principal } from "@dfinity/principal";
import CryptoJS from "crypto-js";

/**
 * Converts a Uint8Array buffer to a hexadecimal string. //this is leftover from when I tried everything to get this to work, if needed I will rewrite bc I already forgot how this works
 *
 * @param {Uint8Array} buffer - The buffer to convert.
 * @returns {string} - The hexadecimal representation.
 */
export const bufferToHex = (buffer) => {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Converts a hexadecimal string to a Uint8Array buffer.
 *
 * @param {string} hex - The hexadecimal string.
 * @returns {Uint8Array} - The resulting buffer.
 */
export const hexToBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

/**
 * Creates an Account Identifier from a Principal and optional SubAccount.
 *
 * @param {string} principalText - The principal as text.
 * @param {number[]} [subAccount=[]] - The subaccount as an array of numbers.
 * @returns {string} - The Account Identifier in hexadecimal.
 */
export const createAccountIdentifier = (principalText, subAccount = []) => {
  const principal = Principal.fromText(principalText);
  const principalBytes = principal.toUint8Array();

  // SHA-224 hash of the principal using crypto-js
  const principalHex = bufferToHex(principalBytes);
  const hash = CryptoJS.SHA224(CryptoJS.enc.Hex.parse(principalHex));
  const hashHex = hash.toString(CryptoJS.enc.Hex);
  const hashBytes = hexToBuffer(hashHex);

  // Append subAccount (if any)
  const accountBytes = new Uint8Array([...hashBytes, ...subAccount]);

  return bufferToHex(accountBytes);
};