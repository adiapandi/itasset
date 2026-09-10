import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SidebarNav } from "@/components/shared/SidebarNav";
import { TopBar } from "@/components/shared/TopBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <div className="print:hidden">
        <SidebarNav roles={(session.user as unknown as { roles: string[] }).roles ?? []} />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="print:hidden">
          <TopBar userName={session.user?.name ?? ""} />
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
