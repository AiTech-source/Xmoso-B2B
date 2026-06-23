export default {
  async fetch(request, env) {
    const accept = request.headers.get("accept") || "";
    // Pass RSC requests straight through to origin, bypassing cache
    if (accept.includes("text/x-component")) {
      return fetch(request, { cf: { cacheTtl: 0 } });
    }
    // Everything else uses default Cloudflare caching
    return fetch(request);
  },
};
