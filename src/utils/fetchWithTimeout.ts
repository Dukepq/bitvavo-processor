async function fetchWithTimeout(
  resource: string,
  options: { [key: string]: string | boolean | number; timer: number }
): Promise<any> {
  const controller = new AbortController();
  const { timer, ...fetchOptions } = options;
  const timeout = setTimeout(() => controller.abort(), timer);
  const response = await fetch(resource, {
    ...fetchOptions,
    signal: controller.signal,
  });
  clearTimeout(timeout);
  return response;
}

export default fetchWithTimeout;
