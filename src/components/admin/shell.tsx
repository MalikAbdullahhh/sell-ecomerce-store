import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Quote,
  Settings,
  ShoppingBag,
  Users,
  Globe,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBrand } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badgeKey?: "orders";
}[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, badgeKey: "orders" },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { to: "/admin/journals", label: "Journals", icon: BookOpen },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/website", label: "Website", icon: Globe },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, adminLogout } = useAuth();
  const { name: brandName, ready: brandReady } = useBrand();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const unreadQuery = useQuery({
    queryKey: ["admin-unread-orders"],
    queryFn: () => adminApi.unreadOrders(),
    refetchInterval: 15000,
  });

  const siteQuery = useQuery({
    queryKey: ["admin", "site"],
    queryFn: () => adminApi.site(),
    staleTime: 30_000,
  });

  useEffect(() => {
    unreadQuery.refetch();
  }, [pathname]);

  const unread = unreadQuery.data?.count ?? 0;
  const logo =
    (siteQuery.data?.settings?.brandName || "").trim() || brandName;
  const logoReady = Boolean(logo) || (brandReady && !siteQuery.isLoading);

  return (
    <div className="fixed inset-0 z-[100] flex bg-background text-foreground">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background transition-transform duration-300 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link
            to="/admin"
            className={cn(
              "font-display text-base font-semibold tracking-[-0.04em]",
              !logoReady && "invisible",
            )}
            onClick={() => setOpen(false)}
          >
            {logo || "\u00A0"}
          </Link>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center md:hidden"
            onClick={() => setOpen(false)}
          >
            <X width={18} height={18} strokeWidth={1.5} />
          </button>
        </div>

        <p className="px-4 pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Admin
        </p>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.to || pathname === `${item.to}/`
              : pathname.startsWith(item.to);
            const Icon = item.icon;
            const showBadge = item.badgeKey === "orders" && unread > 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
                  active ? "bg-foreground text-background" : "hover:bg-mist dark:hover:bg-muted",
                )}
              >
                <span className="relative">
                  <Icon width={15} height={15} strokeWidth={1.5} />
                  {showBadge && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </span>
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span
                    className={cn(
                      "min-w-5 px-1.5 py-0.5 text-center font-mono text-[10px]",
                      active ? "bg-background text-foreground" : "bg-foreground text-background",
                    )}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <p className="truncate px-1 font-mono text-[10px] text-muted-foreground">
            {admin?.email}
          </p>
          <div className="mt-2 flex gap-2">
            <Link
              to="/"
              className="flex-1 border border-border py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-mist dark:hover:bg-muted"
            >
              Store
            </Link>
            <button
              type="button"
              onClick={() => adminLogout()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 border border-border py-2 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-mist dark:hover:bg-muted"
            >
              <LogOut width={12} height={12} />
              Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu width={18} height={18} strokeWidth={1.5} />
          </button>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Control room
          </p>
          {unread > 0 && (
            <Link
              to="/admin/orders"
              className="ml-auto inline-flex items-center gap-2 border border-foreground px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em]"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
              {unread} new order{unread === 1 ? "" : "s"}
            </Link>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
