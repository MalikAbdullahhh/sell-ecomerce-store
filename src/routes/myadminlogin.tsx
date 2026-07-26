import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { adminBtn, adminField, Field } from "@/components/admin/field";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBrand } from "@/lib/store";

export const Route = createFileRoute("/myadminlogin")({
  component: AdminLogin,
  head: () => ({
    meta: [{ title: "Admin Login — Aperture" }],
  }),
});

function AdminLogin() {
  const { admin, adminLogin, loading } = useAuth();
  const { name: brandName } = useBrand();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@aperture.tech");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && admin) {
    return <Navigate to="/admin" />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminLogin(email.trim(), password);
      toast.success("Signed in");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background px-4">
      <div className="w-full max-w-md border border-border p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {brandName} · Admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em]">Sign in</h1>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="username"
              className={adminField}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              className={adminField}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button type="submit" disabled={busy || loading} className={adminBtn}>
            {busy ? "Signing in…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
