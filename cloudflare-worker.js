export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 静态资源放行
    if (path.startsWith("/_next/") || path.startsWith("/cdn-cgi/")) {
      return fetch(request);
    }
    if (/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff2?|ttf|eot|map|json|xml)$/i.test(path)) {
      return fetch(request);
    }

    // 页面请求：从源站获取，强制不缓存
    const response = await fetch(request, { cf: { cacheTtl: -1 } });

    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-cache, no-store, max-age=0, s-maxage=0, must-revalidate, private");
    headers.set("CDN-Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    headers.set("X-Worker", "active");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
