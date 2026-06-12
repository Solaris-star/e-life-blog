import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/lib/member-service";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function requestPasswordResetAction(formData: FormData) {
  "use server";

  await requestPasswordReset(String(formData.get("email") || ""));
  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Account</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-5xl">找回密码</h1>
        <p className="font-bold leading-8 text-[color:var(--walnut)]">输入注册邮箱。如果账号存在，会收到重置链接。</p>
      </header>
      <form action={requestPasswordResetAction} className="mcm-card space-y-4 p-6 md:p-7">
        {params.sent && <p className="border-l-4 border-[color:var(--accent)] pl-4 text-sm font-black text-[color:var(--accent-strong)]">如果账号存在，重置邮件已发送。</p>}
        <input name="email" type="email" placeholder="邮箱地址" autoComplete="email" required className="min-h-12 w-full border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-black outline-none" />
        <button type="submit" className="mcm-button mcm-button-primary">发送重置链接</button>
      </form>
    </div>
  );
}
