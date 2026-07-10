import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand-logo";
import { IslamicPatternBg, ArchOrnament } from "@/components/islamic-pattern";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { signInAndResolve } from "@/lib/auth-session";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — مركز الفرقان القرآني" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden pattern-islamic">
      <IslamicPatternBg />
      <ArchOrnament className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 opacity-25" />
      <ArchOrnament className="pointer-events-none absolute -left-16 -bottom-16 h-80 w-80 rotate-180 opacity-25" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between p-4 sm:p-6">
        <BrandLogo />
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowRight className="ml-2 h-4 w-4" /> رجوع
          </Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <div className="relative mx-auto aspect-square max-w-md">
            <div className="pointer-events-none absolute inset-0 rounded-[3rem] teal-gradient shadow-elev" />
            <div className="pointer-events-none absolute inset-4 rounded-[2.5rem] bg-card p-8">
              <ArchOrnament className="mx-auto h-full w-full" />
            </div>
            <div className="pointer-events-none absolute -bottom-4 -right-4 rounded-2xl gold-gradient p-4 shadow-gold animate-float">
              <ShieldCheck className="h-8 w-8 text-gold-foreground" />
            </div>
          </div>
          <div className="mt-6 text-center">
            <h2 className="font-display text-2xl text-primary">أهلاً بك في بوابة الخير</h2>
            <p className="mt-2 text-sm text-muted-foreground">لوحة تحكم مركز الفرقان القرآني</p>
          </div>
        </div>

        <Card className="relative overflow-hidden p-8 shadow-elev sm:p-10">
          <div className="pointer-events-none absolute inset-0 pattern-islamic opacity-30" />
          <div className="relative z-10">
            <h1 className="font-display text-3xl text-primary">تسجيل الدخول</h1>
            <p className="mt-1 text-sm text-muted-foreground">للمعلمين ومدير المركز فقط</p>

            <form
              className="mt-6 space-y-4"
              autoComplete="on"
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMessage("");
                setLoading(true);
                try {
                  const resolved = await signInAndResolve(email.trim(), password);
                  nav({ to: resolved.role === "admin" ? "/admin" : "/teacher" });
                } catch {
                  setErrorMessage("البريد الإلكتروني أو كلمة المرور غير صحيحة");
                  toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <Label htmlFor="e">البريد الإلكتروني</Label>
                <Input
                  id="e"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  inputMode="email"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="p">كلمة المرور</Label>
                <Input
                  id="p"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              {errorMessage && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "جارٍ التحقق..." : "دخول"}
              </Button>
            </form>
          </div>
        </Card>
      </main>
    </div>
  );
}
