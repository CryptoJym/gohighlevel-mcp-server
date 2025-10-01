/**
 * Cloudflare Worker - GoHighLevel MCP Proxy
 * Wraps the Vercel deployment with Cloudflare's edge network
 */

const VERCEL_URL = 'https://gohighlevel-mcp-server-9ja5gnnww-vuplicity.vercel.app';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'cloudflare-worker',
        upstream: VERCEL_URL
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Proxy all other requests to Vercel
    const targetUrl = `${VERCEL_URL}${url.pathname}${url.search}`;

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });

    try {
      const response = await fetch(modifiedRequest);

      // Add CORS headers
      const modifiedResponse = new Response(response.body, response);
      modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
      modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return modifiedResponse;
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Proxy error',
        message: error.message
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
