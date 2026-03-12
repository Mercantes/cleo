export interface PluggyAuthResponse {
  apiKey: string;
}

export interface PluggyConnectToken {
  accessToken: string;
}

export interface PluggyItem {
  id: string;
  connector: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  status: 'UPDATED' | 'UPDATING' | 'WAITING_USER_INPUT' | 'LOGIN_ERROR' | 'OUTDATED';
  executionStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface PluggyAccount {
  id: string;
  itemId: string;
  name: string;
  type: 'BANK' | 'CREDIT';
  subtype: 'CHECKING_ACCOUNT' | 'SAVINGS_ACCOUNT' | 'CREDIT_CARD';
  balance: number;
  currencyCode: string;
  number: string;
}

export interface PluggyTransaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  type: 'DEBIT' | 'CREDIT';
  category: string | null;
  paymentData: {
    receiver?: {
      name?: string;
    };
  } | null;
  creditCardMetadata?: {
    installmentNumber?: number;
    totalInstallments?: number;
  } | null;
}

export interface PluggyPaginatedResponse<T> {
  total: number;
  totalPages: number;
  page: number;
  results: T[];
}

export class PluggyError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'PluggyError';
  }
}
