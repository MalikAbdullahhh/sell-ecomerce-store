import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi, mediaUrl } from "@/lib/api";
import { pkr } from "@/components/admin/field";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({
    meta: [{ title: "Dashboard — Aperture Admin" }],
  }),
});

function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.dashboard(),
  });

  if (isLoading) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        Loading dashboard…
      </p>
    );
  }

  if (error || !data) {
    return (
      <p className="font-mono text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load dashboard"}
      </p>
    );
  }

  const { stats, recentOrders, lowStock, statusBreakdown } = data;

  const cards = [
    { label: "Orders", value: stats.orders },
    { label: "Revenue", value: pkr(stats.revenue) },
    { label: "Week orders", value: stats.weekOrders },
    { label: "Week revenue", value: pkr(stats.weekRevenue) },
    { label: "Products", value: stats.products },
    { label: "Users", value: stats.users },
    { label: "Reviews", value: stats.reviews },
    { label: "Journals", value: stats.journals },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Overview
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Dashboard</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-border p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em]">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="font-mono text-[10px] uppercase tracking-[0.16em] underline"
            >
              All
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recentOrders.length === 0 && (
              <li className="px-4 py-6 font-mono text-xs text-muted-foreground">No orders yet</li>
            )}
            {recentOrders.map((o) => (
              <li key={o._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-mono text-xs">{o.orderNumber}</p>
                  <p className="truncate text-muted-foreground">{o.shipping?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs">{pkr(o.total)}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {o.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Low stock</h2>
          </div>
          <ul className="divide-y divide-border">
            {lowStock.length === 0 && (
              <li className="px-4 py-6 font-mono text-xs text-muted-foreground">All clear</li>
            )}
            {lowStock.map((p) => (
              <li key={p._id} className="flex items-center gap-3 px-4 py-3">
                {p.images?.[0] && (
                  <img
                    src={mediaUrl(p.images[0])}
                    alt=""
                    className="h-10 w-10 object-cover border border-border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{p.slug}</p>
                </div>
                <span className="font-mono text-xs">{p.stock}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {statusBreakdown.length > 0 && (
        <section className="border border-border p-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Status breakdown</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {statusBreakdown.map((s) => (
              <div key={s._id || "unknown"} className="border border-border px-4 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {s._id || "—"}
                </p>
                <p className="mt-1 font-display text-xl font-semibold">{s.count}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
