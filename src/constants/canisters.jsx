export const CANISTER_IDS = {
  SWAP_POOL: 'xmiu5-jqaaa-aaaag-qbz7q-cai',
  ICP_LEDGER: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  CKBTC_LEDGER: 'mxzaz-hqaaa-aaaar-qaada-cai',
};

export const TOKEN_CONFIG = {
  ICP: {
    symbol: 'ICP',
    decimals: 8,
    fee: BigInt(10_000), // 0.0001 ICP
    canisterId: CANISTER_IDS.ICP_LEDGER,
  },
  CKBTC: {
    symbol: 'ckBTC',
    decimals: 8,
    fee: BigInt(10), // 0.0000001 ckBTC
    canisterId: CANISTER_IDS.CKBTC_LEDGER,
  },
};