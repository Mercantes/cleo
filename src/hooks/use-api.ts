import useSWR, { type SWRConfiguration } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export function useApi<T = unknown>(
  url: string | null,
  config?: SWRConfiguration,
) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    ...config,
  });
}
