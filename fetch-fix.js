const nativeFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  if (!init || !init.headers) return nativeFetch(input, init);

  const headers = new Headers(init.headers);
  headers.delete("HTTP-Referer");
  headers.delete("X-Title");

  return nativeFetch(input, { ...init, headers });
};
