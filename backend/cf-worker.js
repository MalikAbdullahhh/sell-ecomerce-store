// Cloudflare Workers entry for an existing Express API.
// The Express app runs inside a single Durable Object so its MongoDB (mongoose)
// connection stays open between requests (plain Workers cannot reuse sockets).
import { DurableObject } from "cloudflare:workers";
import { handleAsNodeRequest } from "cloudflare:node";
import mongoose from "mongoose";

// ── Idle sleep ──────────────────────────────────────────────────────────────
// An open MongoDB connection keeps heartbeat timers running, which keeps the Durable Object
// "active" (and counting against the free plan's daily duration) even with no visitors.
// After IDLE_MS without requests an alarm closes the connection so the object can go idle;
// the next request reconnects with the app's original settings before it is handled.
const IDLE_MS = 90_000;
let connectArgs = null;
const originalConnect = mongoose.connect.bind(mongoose);
mongoose.connect = (...args) => { connectArgs = args; return originalConnect(...args); };
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
    this.lastSeen = Date.now();
    if (connectArgs && mongoose.connection.readyState === 0) {
      try { await originalConnect(...connectArgs); } catch (e) { console.error("reconnect failed", e?.message); }
    }
    if (!this.alarmSet) {
      this.alarmSet = true;
      this.ctx.storage.setAlarm(Date.now() + IDLE_MS).catch(() => { this.alarmSet = false; });
    }
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

  async alarm() {
    const idle = Date.now() - (this.lastSeen ?? 0);
    if (idle < IDLE_MS) {
      await this.ctx.storage.setAlarm((this.lastSeen ?? Date.now()) + IDLE_MS);
      return;
    }
    this.alarmSet = false;
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect().catch(() => {});
  }
}


export default {
  async fetch(request, env) {
    const stub = env.API_SERVER.get(env.API_SERVER.idFromName("main"), { locationHint: "apac" });
    return stub.fetch(request);
  },
}
