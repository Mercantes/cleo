import type { PluggyAccount } from './types';

export function mapPluggyAccountToDb(
  acc: PluggyAccount,
  userId: string,
  bankConnectionId: string,
) {
  const accountType =
    acc.subtype === 'SAVINGS_ACCOUNT'
      ? 'savings'
      : acc.type === 'CREDIT'
        ? 'credit'
        : 'checking';

  return {
    user_id: userId,
    bank_connection_id: bankConnectionId,
    pluggy_account_id: acc.id,
    name: acc.name,
    type: accountType,
    balance: acc.balance,
    currency: acc.currencyCode || 'BRL',
    number: acc.number || null,
    credit_limit: acc.creditData?.creditLimit ?? null,
    available_credit_limit: acc.creditData?.availableCreditLimit ?? null,
    balance_due_date: acc.creditData?.balanceDueDate ?? null,
    balance_close_date: acc.creditData?.balanceCloseDate ?? null,
    minimum_payment: acc.creditData?.minimumPayment ?? null,
    card_brand: acc.creditData?.brand ?? null,
  };
}
