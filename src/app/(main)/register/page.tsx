import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { COOKIE_NAME } from "@/lib/member-auth";
import { createStoredUser } from "@/lib/member-store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function register(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!name || !email || !email.includes("@")) {
    redirect("/register?error=1");
  }

  const user = await createStoredUser({
    name,
    email,
    plan: "free",
    status: "inactive",
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/account");
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Register</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          注册账号
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          注册后会写入私有用户表，默认是未订阅状态。管理员可以在后台看到注册用户和访问记录。
        </p>
      </header>

      {params.error && (
        <div className="mcm-card border-[color:var(--accent)] p-5 text-sm font-bold text-[color:var(--accent-strong)]">
          请填写名称和有效邮箱。
        </div>
      )}

      <form action={register} className="mcm-card space-y-5 p-6 md:p-7">
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="name">
            名称
          </label>
          <input id="name" name="name" className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-bold outline-none" />
        </div>
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="email">
            邮箱
          </label>
          <input id="email" name="email" type="email" className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-bold outline-none" />
        </div>
        <button type="submit" className="mcm-button mcm-button-primary">
          注册并登录
        </button>
      </form>

      <Link href="/login" className="inline-flex text-sm font-black text-[color:var(--accent-strong)]">
        已有账号，去登录
      </Link>
    </div>
  );
}
