import useSWR, { type SWRConfiguration } from 'swr';

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
};

export function useApi<T = unknown>(
  url: string | null,
  config?: SWRConfiguration,
) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    errorRetryCount: 2,
    errorRetryInterval: 3000,
    ...config,
  });
}
