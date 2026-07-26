import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/shell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-background">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Loading…
        </p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/myadminlogin" />;
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
