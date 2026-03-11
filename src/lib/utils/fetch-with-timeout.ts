/**
 * Fetch wrapper with AbortController timeout.
 * Default timeout: 15 seconds.
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const { timeoutMs = 15_000, ...fetchInit } = init || {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(input, { ...fetchInit, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}
