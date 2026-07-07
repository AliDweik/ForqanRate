import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, School, Award, LogOut } from "lucide-react";
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
import { classesOfTeacher } from "@/lib/firestore-data";
import { logout, useAuthSession } from "@/lib/auth-session";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function TeacherSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const session = useAuthSession();
  const nav = useNavigate();
  const myClasses = session.teacher ? classesOfTeacher(session.teacher.id) : [];
  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b p-3">
        <BrandLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={path === "/teacher"} tooltip="لوحة المعلم">
                  <Link to="/teacher" className="flex items-center gap-3">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>لوحة المعلم</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>شعبي</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {myClasses.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={path.includes(`/teacher/class/${c.id}`)}
                    tooltip={c.name}
                  >
                    <Link
                      to="/teacher/class/$id"
                      params={{ id: c.id }}
                      className="flex items-center gap-3"
                    >
                      <School className="h-4 w-4" />
                      <span>{c.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {session.ready && myClasses.length === 0 && (
                <SidebarMenuItem>
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    لا توجد شعب مرتبطة بهذا الحساب
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="عرض ولي الأمر">
              <Link to="/" className="flex items-center gap-3 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>عرض ولي الأمر</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
