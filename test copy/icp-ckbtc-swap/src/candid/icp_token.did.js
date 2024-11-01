// src/candid/icp_token.did.js

export const idlFactory = ({ IDL }) => {
  const ApproveArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    spender: IDL.Principal,
    amount: IDL.Nat,
    expected_allowance: IDL.Opt(IDL.Nat),
    expires_at: IDL.Opt(IDL.Nat64),
  });
  const ApproveResult = IDL.Variant({
    ok: IDL.Null,
    err: IDL.Text,
  });
  return IDL.Service({
    icrc1_approve: IDL.Func([ApproveArgs], [ApproveResult], []),
    // This is not used but I am too lazy to remove it because I am afraid it will break something
  });
};
export const canisterId = "mxzaz-hqaaa-aaaar-qaada-cai"; // Example ckBTC token canister ID