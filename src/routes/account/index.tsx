import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eyebrow } from "@/components/site/focus";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Sign In or Create an Account — Aperture" },
      { name: "description", content: "Access your Aperture order history, tracking and warranty registrations." },
      { property: "og:title", content: "Sign In — Aperture" },
      { property: "og:description", content: "Access your Aperture orders and warranty registrations." },
    ],
  }),
  component: Account,
});

const field = "h-12 w-full border border-border bg-transparent px-3 font-mono text-sm outline-none focus:border-foreground";

function Account() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <Eyebrow>Account</Eyebrow>
      <h1 className="mt-2 text-4xl">{mode === "login" ? "Sign in" : "Create account"}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("Demo only — accounts are not connected yet.");
        }}
        className="mt-8 grid gap-3"
      >
        {mode === "signup" && <input className={field} placeholder="Full name" autoComplete="name" />}
        <input required type="email" inputMode="email" className={field} placeholder="Email" autoComplete="email" />
        <input required type="password" className={field} placeholder="Password" autoComplete="current-password" />
        <button className="h-12 bg-foreground font-mono text-xs uppercase tracking-[0.22em] text-background">
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-6 border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.18em]"
      >
        {mode === "login" ? "Create an account instead" : "I already have an account"}
      </button>

      <p className="mt-10 font-mono text-[11px] text-muted-foreground">
        Looking for a past order?{" "}
        <Link to="/account/orders" className="underline">
          Order history
        </Link>
      </p>
    </div>
  );
}