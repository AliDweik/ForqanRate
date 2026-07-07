import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/auth-session";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const nav = useNavigate();
  const session = useAuthSession();

  useEffect(() => {
    if (!session.ready) return;
    if (session.role !== "admin") nav({ to: "/login" });
  }, [nav, session.ready, session.role]);

  if (!session.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          جارٍ التحقق من الصلاحيات...
        </div>
      </div>
    );
  }

  if (session.role !== "admin") return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="text-sm text-muted-foreground">لوحة تحكم المدير العام</div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">
                  <User className="ml-2 h-4 w-4" /> المدير
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
