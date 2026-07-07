import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  Sparkles,
  Upload,
  BarChart3,
  Settings,
  LogOut,
  CalendarDays,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/brand-logo";
import { useNavigate } from "@tanstack/react-router";
import { logout } from "@/lib/auth-session";
import { toast } from "sonner";

const items = [
  { title: "لوحة التحكم", url: "/admin", icon: LayoutDashboard },
  { title: "المعلمون", url: "/admin/teachers", icon: Users },
  { title: "الشعب", url: "/admin/classes", icon: School },
  { title: "الطلاب", url: "/admin/students", icon: GraduationCap },
  { title: "معايير التميّز", url: "/admin/standards", icon: Sparkles },
  { title: "التقويم الدراسي", url: "/admin/calendar", icon: CalendarDays },
  { title: "استيراد الطلاب", url: "/admin/import", icon: Upload },
  { title: "التقارير", url: "/admin/reports", icon: BarChart3 },
  { title: "الإعدادات", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b p-3">
        <BrandLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = it.url === "/admin" ? path === "/admin" : path.startsWith(it.url);
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={it.title}>
                      <Link to={it.url} className="flex items-center gap-3">
                        <it.icon className="h-4 w-4 shrink-0" />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="تسجيل الخروج"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={async () => {
                await logout();
                toast.success("تم تسجيل الخروج");
                nav({ to: "/login" });
              }}
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4" />
                <span>تسجيل الخروج</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
