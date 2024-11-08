import { Principal } from "@dfinity/principal";
import { getCrc32 } from "@dfinity/principal/lib/cjs/utils/getCrc";
import { sha224 } from "@dfinity/principal/lib/cjs/utils/sha224";
import { TOKEN_CONFIG } from '../constants/canisters';

export const formatAmount = (amount, token) => {
  const decimals = TOKEN_CONFIG[token].decimals;
  return (Number(amount) / Math.pow(10, decimals)).toFixed(decimals);
};

export const parseAmount = (amount, token) => {
  const decimals = TOKEN_CONFIG[token].decimals;
  return BigInt(Math.floor(Number(amount) * Math.pow(10, decimals)));
};

export const calculateMinimumReceived = (amount, slippageTolerance) => {
  return BigInt(Math.floor(Number(amount) * (1 - slippageTolerance / 100)));
};

// Convert to 32-bit array
export const getSubAccountArray = (s) => {
  if (Array.isArray(s)) {
    return s.concat(Array(32 - s.length).fill(0));
  } else {
    return Array(28).fill(0).concat(to32bits(s ? s : 0));
  }
};

const to32bits = (num) => {
  let b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
};

// Strictly output a Uint8Array without re-interpretation
export const principalToAccountIdentifier = (principalText, subaccount) => {
  const principal = Principal.fromText(principalText); // Ensure it's a valid principal string
  const padding = new TextEncoder().encode("\x0Aaccount-id");
  const subAccountArray = getSubAccountArray(subaccount);
  const array = new Uint8Array([
    ...padding,
    ...principal.toUint8Array(),
    ...subAccountArray
  ]);
  const hash = sha224(array);
  const checksum = to32bits(getCrc32(hash));
  return new Uint8Array([...checksum, ...hash]); // Strictly Uint8Array
};

// Default account without additional interpretation
export const getDefaultAccount = (principal) => {
  return {
    owner: principal,
    subaccount: []
  };
};

export const getAccountIdentifier = (principal) => {
  return principalToAccountIdentifier(principal.toText(), undefined);
};