import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — مركز الفرقان القرآني" }] }),
  component: LoginPage,
});

const LOGIN_MODULE_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), LOGIN_MODULE_TIMEOUT_MS);
    }),
  ]);
}

function getLoginErrorMessage(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : "";

  if (
    message === "login-module-timeout" ||
    message.includes("Failed to fetch dynamically imported module")
  ) {
    return "تعذر تحميل خدمة تسجيل الدخول. حدّث الصفحة وتأكد من اتصال الإنترنت.";
  }

  if (code === "auth/unauthorized-domain") {
    return "نطاق GitHub Pages غير مصرح به في Firebase. أضف alidweik.github.io إلى Authorized domains.";
  }

  if (
    code === "auth/network-request-failed" ||
    message === "auth-timeout" ||
    message === "firestore-timeout"
  ) {
    return "تعذر الاتصال بخدمة تسجيل الدخول. تحقق من الإنترنت وحاول مرة أخرى.";
  }

  return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
}

function LoginPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-4 sm:p-6">
        <Link to="/" className="text-lg font-bold text-primary">
          مركز الفرقان القرآني
        </Link>
        <Link
          to="/"
          className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
        >
          رجوع
        </Link>
      </header>

      <main className="mx-auto flex max-w-md px-4 py-8 sm:px-6">
        <section className="w-full rounded-lg border border-border bg-card p-6 shadow-elev sm:p-8">
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
                  const email = String(form.get("forqan_user") ?? "").trim();
                  const password = String(form.get("forqan_pass") ?? "");
                  const { signInAndResolve } = await withTimeout(
                    import("@/lib/auth-session"),
                    "login-module-timeout",
                  );
                  const resolved = await signInAndResolve(email, password);
                  nav({ to: resolved.role === "admin" ? "/admin" : "/teacher" });
                } catch (error) {
                  setErrorMessage(getLoginErrorMessage(error));
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <label htmlFor="forqan-user" className="mb-1.5 block text-sm font-medium">
                  البريد الإلكتروني
                </label>
                <input
                  id="forqan-user"
                  name="forqan_user"
                  type="text"
                  placeholder="name@example.com"
                  dir="ltr"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  spellCheck={false}
                  autoComplete="off"
                  className="block h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="forqan-pass" className="mb-1.5 block text-sm font-medium">
                  كلمة المرور
                </label>
                <input
                  id="forqan-pass"
                  name="forqan_pass"
                  type="password"
                  placeholder="••••••••"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  autoComplete="off"
                  className="block h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:border-primary"
                  required
                />
              </div>
              {errorMessage && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <button
                type="submit"
                className="h-10 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "جارٍ التحقق..." : "دخول"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
