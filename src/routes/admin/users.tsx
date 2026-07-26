import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  adminBtn,
  adminBtnGhost,
  adminBtnOutline,
  adminField,
  Field,
} from "@/components/admin/field";
import { adminApi, type AdminUserDoc } from "@/lib/api";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
  head: () => ({ meta: [{ title: "Users — Aperture Admin" }] }),
});

type UserForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
};

const emptyForm = (): UserForm => ({
  name: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
});

function AdminUsers() {
  const qc = useQueryClient();
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.users(),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.email.trim()) {
        throw new Error("Name and email are required");
      }
      if (editingId) {
        const body: Parameters<typeof adminApi.updateUser>[1] = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          isActive: form.isActive,
        };
        if (form.password.trim()) body.password = form.password.trim();
        return adminApi.updateUser(editingId, body);
      }
      if (form.password.trim().length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      return adminApi.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password.trim(),
        isActive: form.isActive,
      });
    },
    onSuccess: () => {
      toast.success(editingId ? "User updated" : "User created");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      if (editingId) {
        setEditingId(null);
        setForm(emptyForm());
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (u: AdminUserDoc) => {
    setEditingId(u._id);
    setForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      password: "",
      isActive: u.isActive !== false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Accounts
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Users</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Passwords are stored hashed and cannot be viewed. Set a new password to reset access.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-x-auto border border-border">
          {isLoading ? (
            <p className="p-4 font-mono text-xs text-muted-foreground">Loading…</p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-mist/40 font-mono text-[10px] uppercase tracking-[0.16em]">
                <tr>
                  <th className="px-3 py-3 font-normal">Name</th>
                  <th className="px-3 py-3 font-normal">Email</th>
                  <th className="px-3 py-3 font-normal">Phone</th>
                  <th className="px-3 py-3 font-normal">Joined</th>
                  <th className="px-3 py-3 font-normal">Active</th>
                  <th className="px-3 py-3 font-normal" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.users || []).map((u) => {
                  const active = u.isActive !== false;
                  return (
                    <tr key={u._id} className="hover:bg-mist/30">
                      <td className="px-3 py-3">{u.name}</td>
                      <td className="px-3 py-3 font-mono text-xs">{u.email}</td>
                      <td className="px-3 py-3 font-mono text-xs">{u.phone || "—"}</td>
                      <td className="px-3 py-3 font-mono text-[10px] text-muted-foreground">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-PK") : "—"}
                      </td>
                      <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.14em]">
                        {active ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className={adminBtnGhost}
                            onClick={() => startEdit(u)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={adminBtnGhost}
                            onClick={() => {
                              if (confirm(`Delete ${u.email}?`)) deleteMut.mutate(u._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(data?.users || []).length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center font-mono text-xs text-muted-foreground"
                    >
                      No users
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <form
          className="h-fit space-y-3 border border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
            {editingId ? "Edit user" : "New user"}
          </p>
          <Field label="Name">
            <input
              className={adminField}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={adminField}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </Field>
          <Field label="Phone">
            <input
              className={adminField}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label={editingId ? "New password (optional)" : "Password"}>
            <input
              type="password"
              className={adminField}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editingId ? "Leave blank to keep" : "Min 6 characters"}
              required={!editingId}
              minLength={editingId ? undefined : 6}
              autoComplete="new-password"
            />
          </Field>
          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={adminBtn} disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                className={adminBtnOutline}
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm());
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
