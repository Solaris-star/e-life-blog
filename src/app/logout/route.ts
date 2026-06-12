import { redirect } from "next/navigation";
import { clearMemberSession } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST() {
  await clearMemberSession();
  redirect("/login");
}

export async function GET() {
  await clearMemberSession();
  redirect("/login");
}
