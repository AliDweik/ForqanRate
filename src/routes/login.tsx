import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — مركز الفرقان القرآني" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-4 sm:p-6">
        <BrandLogo />
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowRight className="ml-2 h-4 w-4" /> رجوع
          </Link>
        </Button>
      </header>

      <main className="mx-auto flex max-w-md px-4 py-8 sm:px-6">
        <Card className="w-full p-6 shadow-elev sm:p-8">
          <div>
            <h1 className="font-display text-3xl text-primary">تسجيل الدخول</h1>
            <p className="mt-1 text-sm text-muted-foreground">للمعلمين ومدير المركز فقط</p>

            <form
              className="mt-6 space-y-4"
              autoComplete="off"
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMessage("");
                setLoading(true);
                try {
                  const form = new FormData(e.currentTarget);
                  const email = String(form.get("email") ?? "").trim();
                  const password = String(form.get("password") ?? "");
                  const { signInAndResolve } = await import("@/lib/auth-session");
                  const resolved = await signInAndResolve(email.trim(), password);
                  nav({ to: resolved.role === "admin" ? "/admin" : "/teacher" });
                } catch {
                  setErrorMessage("البريد الإلكتروني أو كلمة المرور غير صحيحة");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <Label htmlFor="e">البريد الإلكتروني</Label>
                <input
                  id="e"
                  name="email"
                  type="text"
                  placeholder="name@example.com"
                  dir="ltr"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="off"
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base shadow-sm outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <Label htmlFor="p">كلمة المرور</Label>
                <input
                  id="p"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="off"
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base shadow-sm outline-none focus:ring-1 focus:ring-ring"
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
