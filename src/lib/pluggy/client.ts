import { getPluggyConfig } from '@/lib/env';
import type {
  PluggyAuthResponse,
  PluggyConnectToken,
  PluggyItem,
  PluggyAccount,
  PluggyTransaction,
  PluggyPaginatedResponse,
} from './types';
import { PluggyError } from './types';

const BASE_URL = process.env.PLUGGY_SANDBOX === 'true'
  ? 'https://api.pluggy.ai/sandbox'
  : 'https://api.pluggy.ai';
const TOKEN_RENEWAL_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
const TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_RETRIES = 3;
const PAGE_SIZE = 500;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) return response;

    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
      continue;
    }

    const body = await response.text();
    throw new PluggyError(
      body || `Pluggy API error: ${response.status}`,
      response.status,
    );
  }

  throw new PluggyError('Max retries exceeded', 0);
}

export async function authenticate(): Promise<string> {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt - TOKEN_RENEWAL_BUFFER_MS) {
    return cachedToken;
  }

  const { clientId, clientSecret } = getPluggyConfig();

  const response = await fetchWithRetry(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  const data = (await response.json()) as PluggyAuthResponse;
  cachedToken = data.apiKey;
  tokenExpiresAt = now + TOKEN_LIFETIME_MS;

  return cachedToken;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await authenticate();

  const response = await fetchWithRetry(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': token,
      ...options.headers,
    },
  });

  return response.json() as Promise<T>;
}

export async function createConnectToken(itemId?: string): Promise<PluggyConnectToken> {
  return apiRequest<PluggyConnectToken>('/connect_token', {
    method: 'POST',
    body: JSON.stringify(itemId ? { itemId } : {}),
  });
}

export async function getItem(itemId: string): Promise<PluggyItem> {
  return apiRequest<PluggyItem>(`/items/${itemId}`);
}

export async function getAccounts(itemId: string): Promise<PluggyAccount[]> {
  const data = await apiRequest<PluggyPaginatedResponse<PluggyAccount>>(
    `/accounts?itemId=${itemId}`,
  );
  return data.results;
}

export async function getTransactions(
  accountId: string,
  from: string,
  to: string,
): Promise<PluggyTransaction[]> {
  const allTransactions: PluggyTransaction[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const params = new URLSearchParams({
      accountId,
      from,
      to,
      pageSize: String(PAGE_SIZE),
      page: String(page),
    });

    const data = await apiRequest<PluggyPaginatedResponse<PluggyTransaction>>(
      `/transactions?${params.toString()}`,
    );

    allTransactions.push(...data.results);
    totalPages = data.totalPages;
    page++;
  }

  return allTransactions;
}

/** Reset cached token — useful for testing */
export function _resetTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}
