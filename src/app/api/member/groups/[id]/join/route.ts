import crypto from "crypto";
import { logMemberAccess } from "@/lib/member-access-log";
import { requireApiActiveSubscription } from "@/lib/member-auth";
import { canAccessResource, getMemberGroupById } from "@/lib/member-data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiActiveSubscription();
  if (user instanceof Response) return withPrivateCache(user);

  const { id } = await params;
  const group = getMemberGroupById(id);
  if (!group) {
    return Response.json({ error: "群组不存在。" }, { status: 404, headers: privateCacheHeaders() });
  }

  if (!canAccessResource(user, group)) {
    return Response.json({ error: "当前方案不能加入这个群组。" }, { status: 403, headers: privateCacheHeaders() });
  }

  await logMemberAccess({ action: "join_group", userId: user.id, targetId: group.id });

  const inviteCode = `INV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  return Response.json(
    {
      inviteCode,
      expiresAt,
      note: "这是短时邀请码，不是永久邀请链接。",
    },
    {
      headers: privateCacheHeaders(),
    }
  );
}

function withPrivateCache(response: Response) {
  privateCacheHeaders().forEach((value, key) => response.headers.set(key, value));
  return response;
}

function privateCacheHeaders() {
  return new Headers({
    "Cache-Control": "private, no-store, max-age=0",
  });
}
