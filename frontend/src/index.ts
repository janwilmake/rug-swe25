/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import htmlContent from '../public/index.html';
export interface Env {
  HTML_PAGES: KVNamespace;
}


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    let pageKey = "index.html"; // Default page
    if (url.pathname === "/frontend") {
      pageKey = "frontend-category.html";
    }

    // Retrieve the page content from KV
    const pageContent = await env.HTML_PAGES.get(pageKey, "text");

    if (!pageContent) {
      return new Response("<h1>404 Not Found</h1>", { status: 404, headers: { "Content-Type": "text/html" } });
    }

    return new Response(pageContent, { headers: { "Content-Type": "text/html" } });
  },
};

