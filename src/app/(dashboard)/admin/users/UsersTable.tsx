interface UserRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  department: { name: string } | null;
  roles: { role: { name: string } }[];
}

export function UsersTable({ users }: { users: UserRow[] }) {
  if (users.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-ink-soft">
        No users yet. Use the form above to add the first account.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-sunken text-ink-soft">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Department</th>
            <th className="px-4 py-2 font-medium">Roles</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2 text-ink">{u.name}</td>
              <td className="px-4 py-2 font-mono text-xs text-ink-soft">{u.email}</td>
              <td className="px-4 py-2 text-ink-soft">{u.department?.name ?? "—"}</td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <span
                      key={r.role.name}
                      className="rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent"
                    >
                      {r.role.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2">
                <span
                  className={
                    u.isActive
                      ? "rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent"
                      : "rounded bg-danger-soft px-1.5 py-0.5 text-xs text-danger"
                  }
                >
                  {u.isActive ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
