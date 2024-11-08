export const swapInterface = ({ IDL }) => {
  const Token = IDL.Record({
    address: IDL.Text,
    standard: IDL.Text
  });

  const Error = IDL.Variant({
    CommonError: IDL.Null,
    InsufficientFunds: IDL.Null,
    InternalError: IDL.Text,
    UnsupportedToken: IDL.Text
  });

  const Result = IDL.Variant({
    ok: IDL.Nat,
    err: Error
  });

  const SwapArgs = IDL.Record({
    amountIn: IDL.Text,
    zeroForOne: IDL.Bool,
    amountOutMinimum: IDL.Text
  });

  const DepositArgs = IDL.Record({
    amount: IDL.Nat,
    fee: IDL.Nat,
    token: IDL.Text
  });

  const WithdrawArgs = IDL.Record({
    amount: IDL.Nat,
    fee: IDL.Nat,
    token: IDL.Text
  });

  return IDL.Service({
    depositFrom: IDL.Func([DepositArgs], [Result], []),
    quote: IDL.Func([SwapArgs], [Result], ['query']),
    swap: IDL.Func([SwapArgs], [Result], []),
    withdraw: IDL.Func([WithdrawArgs], [Result], [])
  });
};