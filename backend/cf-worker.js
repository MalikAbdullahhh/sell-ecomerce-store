// Cloudflare Workers entry for an existing Express API.
// The Express app runs inside a single Durable Object so its MongoDB (mongoose)
// connection stays open between requests (plain Workers cannot reuse sockets).
import { DurableObject } from "cloudflare:workers";
import { handleAsNodeRequest } from "cloudflare:node";
import fs from "node:fs";

const PORT = Number(process.env.PORT || 5000);

// Workers have no writable project directory (only an ephemeral /tmp). Apps that create
// folders such as ./uploads at startup would crash, so ignore "not permitted" there.
for (const name of ["mkdirSync", "mkdir"]) {
  const orig = fs[name];
  try {
    fs[name] = function (p, ...rest) {
      try { return orig.call(fs, p, ...rest); } catch (e) {
        if (/not permitted|EPERM|EROFS/i.test(String(e?.message || e?.code))) return undefined;
        throw e;
      }
    };
  } catch {}
}

export class ApiServer extends DurableObject {
  async fetch(request) {
    // Importing the server module starts Express (app.listen) and connects to MongoDB once.
    this.ready ??= import("./src/index.js").catch((e) => { this.ready = undefined; throw e; });
    try {
      await this.ready;
      // Apps that connect to MongoDB before app.listen() start listening asynchronously;
      // retry briefly until the server is up (only affects the very first request).
      for (let i = 0; ; i++) {
        try {
          return await handleAsNodeRequest(PORT, request.clone());
        } catch (e) {
          if (i >= 75 || !/port|listen|server/i.test(String(e?.message))) throw e;
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    } catch (e) {
      console.error("API error:", e?.stack || e);
      return Response.json({ message: "Server error" }, { status: 500 });
    }
  }
}

export default {
  async fetch(request, env) {
    const stub = env.API_SERVER.get(env.API_SERVER.idFromName("main"), { locationHint: "apac" });
    return stub.fetch(request);
  },
};
