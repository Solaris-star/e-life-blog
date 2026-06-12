import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json(
    user
      ? {
          authenticated: true,
          name: user.name,
        }
      : { authenticated: false },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
