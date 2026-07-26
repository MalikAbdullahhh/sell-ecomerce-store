import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, MessageCircle, Phone, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Eyebrow } from "@/components/site/focus";
import { PageSkeleton } from "@/components/site/skeletons";
import { authApi, mediaUrl, type UserAddress } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Sign In or Create an Account — Aperture" },
      {
        name: "description",
        content: "Access your Aperture order history, tracking and warranty registrations.",
      },
      { property: "og:title", content: "Sign In — Aperture" },
      {
        property: "og:description",
        content: "Access your Aperture orders and warranty registrations.",
      },
    ],
  }),
  component: Account,
});

const field =
  "h-12 w-full border border-border bg-transparent px-3 font-mono text-sm outline-none transition-colors focus:border-foreground";

function Account() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { user, login, register, logout, loading, setUser } = useAuth();
  const { settings } = useStore();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const addr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
    setProfile({
      name: user.name || "",
      phone: user.phone || addr?.phone || "",
      address: addr?.address || "",
      city: addr?.city || "",
      postalCode: addr?.postalCode || "",
    });
  }, [user]);

  if (loading) return <PageSkeleton rows={2} />;

  if (user) {
    const contact = settings?.contact;
    const avatarSrc = mediaUrl(user.avatar);
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <Eyebrow>Your profile</Eyebrow>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-20 w-20 border border-border object-cover"
                />
              ) : (
                <span className="grid h-20 w-20 place-items-center border border-border bg-secondary text-muted-foreground">
                  <UserIcon width={28} height={28} strokeWidth={1.4} />
                </span>
              )}
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-foreground/85 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-background disabled:opacity-60"
              >
                <Camera width={11} height={11} />
                {avatarBusy ? "…" : "Photo"}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (file.size > 8 * 1024 * 1024) {
                    toast.error("Image must be under 8 MB");
                    return;
                  }
                  setAvatarBusy(true);
                  try {
                    const res = await authApi.uploadAvatar(file);
                    setUser(res.user);
                    toast.success("Photo updated");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Upload failed");
                  } finally {
                    setAvatarBusy(false);
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-4xl">{user.name}</h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Link
            to="/account/orders"
            className="grid h-12 place-items-center bg-foreground px-6 font-mono text-xs uppercase tracking-[0.2em] text-background"
          >
            Order history
          </Link>
        </div>

        <form
          className="mt-10 grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (profile.phone.trim() && profile.phone.replace(/\D/g, "").length < 11) {
              toast.error("Phone must be at least 11 digits");
              return;
            }
            if (profile.address.trim() && profile.address.trim().length < 10) {
              toast.error("Address must be at least 10 characters");
              return;
            }
            setSaving(true);
            try {
              const addresses: UserAddress[] = [
                {
                  label: "Default",
                  name: profile.name,
                  phone: profile.phone,
                  address: profile.address,
                  city: profile.city,
                  postalCode: profile.postalCode,
                  isDefault: true,
                },
              ];
              const { user: next } = await authApi.updateMe({
                name: profile.name,
                phone: profile.phone,
                addresses,
              });
              setUser(next);
              toast.success("Profile saved — checkout will autofill these details.");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save");
            } finally {
              setSaving(false);
            }
          }}
        >
          <h2 className="sm:col-span-2 font-display text-2xl">Shipping details</h2>
          <input
            className={field}
            placeholder="Full name"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Phone (11+ digits)"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
          />
          <input
            className={`${field} sm:col-span-2`}
            placeholder="Street address (10+ characters)"
            value={profile.address}
            onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
          />
          <input
            className={field}
            placeholder="City"
            value={profile.city}
            onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Postal code"
            value={profile.postalCode}
            onChange={(e) => setProfile((p) => ({ ...p, postalCode: e.target.value }))}
          />
          <button
            disabled={saving}
            className="h-12 bg-foreground font-mono text-xs uppercase tracking-[0.2em] text-background disabled:opacity-50 sm:col-span-2 sm:justify-self-start sm:px-8"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>

        <form
          className="mt-12 grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await authApi.changePassword({
                currentPassword: passwords.current,
                newPassword: passwords.next,
              });
              setPasswords({ current: "", next: "" });
              toast.success("Password updated");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not change password");
            }
          }}
        >
          <h2 className="sm:col-span-2 font-display text-2xl">Change password</h2>
          <input
            type="password"
            className={field}
            placeholder="Current password"
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
          />
          <input
            type="password"
            minLength={6}
            className={field}
            placeholder="New password (6+)"
            value={passwords.next}
            onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
          />
          <button className="h-12 border border-foreground font-mono text-xs uppercase tracking-[0.2em] sm:col-span-2 sm:justify-self-start sm:px-8">
            Update password
          </button>
        </form>

        <section className="mt-12 border-t border-border pt-8">
          <Eyebrow>Need help?</Eyebrow>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {settings?.help?.helpText ||
              "Questions about an order? Call or WhatsApp — we reply within one working day."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`tel:${contact?.phone || ""}`}
              className="flex h-11 items-center gap-2 border border-foreground px-4 font-mono text-xs"
            >
              <Phone width={15} /> {settings?.help?.callLabel || "Call"} · {contact?.phone}
            </a>
            <a
              href={`https://wa.me/${(contact?.whatsapp || "").replace(/\D/g, "")}`}
              className="flex h-11 items-center gap-2 bg-foreground px-4 font-mono text-xs text-background"
            >
              <MessageCircle width={15} /> {settings?.help?.whatsappLabel || "WhatsApp"}
            </a>
          </div>
        </section>

        <button
          onClick={logout}
          className="mt-10 border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.18em]"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <Eyebrow>Account</Eyebrow>
      <h1 className="mt-2 text-4xl">{mode === "login" ? "Sign in" : "Create account"}</h1>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setSaving(true);
          const email = String(form.get("email") || "");
          const password = String(form.get("password") || "");
          try {
            if (mode === "login") await login(email, password);
            else await register({ name: String(form.get("name") || ""), email, password });
            toast.success(mode === "login" ? "Signed in." : "Account created.");
            navigate({ to: "/", hash: "newsletter" });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Authentication failed");
          } finally {
            setSaving(false);
          }
        }}
        className="mt-8 grid gap-3"
      >
        {mode === "signup" && (
          <input
            required
            name="name"
            className={field}
            placeholder="Full name"
            autoComplete="name"
          />
        )}
        <input
          required
          name="email"
          type="email"
          inputMode="email"
          className={field}
          placeholder="Email"
          autoComplete="email"
        />
        <input
          required
          minLength={6}
          name="password"
          type="password"
          className={field}
          placeholder="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        <button
          disabled={saving}
          className="h-12 bg-foreground font-mono text-xs uppercase tracking-[0.22em] text-background disabled:opacity-50"
        >
          {saving ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
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
