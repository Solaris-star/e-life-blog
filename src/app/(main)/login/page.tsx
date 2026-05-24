import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { COOKIE_NAME, getCurrentUser, getDemoUserId } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function login(formData: FormData) {
  "use server";

  const rawMode = formData.get("mode");
  const mode = rawMode === "inactive" || rawMode === "admin" ? rawMode : "active";
  const userId = await getDemoUserId(mode);
  if (!userId) {
    redirect("/register");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(mode === "admin" ? "/admin" : mode === "active" ? "/member" : "/subscribe");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const mode = params.mode === "inactive" || params.mode === "admin" ? params.mode : "active";

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Login</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          登录
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          当前项目还没有接入真实登录服务，这里先提供本地演示会话，方便验证会员权限流程。新用户可以先注册。
        </p>
      </header>

      {user && (
        <div className="mcm-card p-5 text-sm font-bold leading-7 text-[color:var(--walnut)]">
          当前已登录：{user.email}。你可以继续切换演示身份。
        </div>
      )}

      <form action={login} className="mcm-card space-y-5 p-6 md:p-7">
        <input type="hidden" name="mode" value={mode} />
        <div>
          <p className="section-kicker">Demo Session</p>
          <h2 className="mt-3 text-2xl font-black text-[color:var(--foreground)]">
            {mode === "admin" ? "管理员" : mode === "active" ? "订阅有效用户" : "未订阅用户"}
          </h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">
            提交后会写入 httpOnly cookie，会员页面和 API 都会在服务端读取并校验。
          </p>
        </div>
        <button type="submit" className="mcm-button mcm-button-primary">
          登录演示账户
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/register" className="mcm-card p-5 text-sm font-black text-[color:var(--accent-strong)]">
          注册新账号
        </Link>
        <Link href="/login?mode=admin" className="mcm-card p-5 text-sm font-black text-[color:var(--accent-strong)]">
          管理员登录
        </Link>
      </div>
    </div>
  );
}
