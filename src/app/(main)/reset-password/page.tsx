import Link from "next/link";
import { redirect } from "next/navigation";
import { resetMemberPassword } from "@/lib/member-service";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function resetPasswordAction(formData: FormData) {
  "use server";

  const ok = await resetMemberPassword({
    token: String(formData.get("token") || ""),
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  });
  redirect(`/reset-password?status=${ok ? "success" : "invalid"}`);
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; status?: string }> }) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Account</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-5xl">重置密码</h1>
      </header>
      <section className="mcm-card space-y-4 p-6 md:p-7">
        {params.status === "success" ? (
          <div className="space-y-4">
            <p className="font-bold leading-7 text-[color:var(--walnut)]">密码已更新，请重新登录。</p>
            <Link href="/login" className="mcm-button mcm-button-primary">去登录</Link>
          </div>
        ) : (
          <form action={resetPasswordAction} className="space-y-4">
            {params.status === "invalid" && <p className="border-l-4 border-[color:var(--accent)] pl-4 text-sm font-black text-[color:var(--accent-strong)]">链接无效或密码格式不正确。</p>}
            <input type="hidden" name="token" value={params.token ?? ""} />
            <input name="password" type="password" placeholder="新密码，至少 8 位" autoComplete="new-password" minLength={8} required className="min-h-12 w-full border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-black outline-none" />
            <input name="confirmPassword" type="password" placeholder="再次输入新密码" autoComplete="new-password" minLength={8} required className="min-h-12 w-full border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-black outline-none" />
            <button type="submit" className="mcm-button mcm-button-primary">更新密码</button>
          </form>
        )}
      </section>
    </div>
  );
}
