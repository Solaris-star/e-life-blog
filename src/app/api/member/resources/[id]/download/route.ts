import { logMemberAccess } from "@/lib/member-access-log";
import { requireApiActiveSubscription } from "@/lib/member-auth";
import { canAccessResource, getMemberResourceById } from "@/lib/member-data";
import { createSignedResourceToken } from "@/lib/signed-url";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiActiveSubscription();
  if (user instanceof Response) return withPrivateCache(user);

  const { id } = await params;
  const resource = getMemberResourceById(id);
  if (!resource) {
    return Response.json({ error: "资料不存在。" }, { status: 404, headers: privateCacheHeaders() });
  }

  if (!canAccessResource(user, resource)) {
    return Response.json({ error: "当前方案不能下载这份资料。" }, { status: 403, headers: privateCacheHeaders() });
  }

  await logMemberAccess({ action: "download", userId: user.id, targetId: resource.id });

  const { token, expires } = createSignedResourceToken(resource.id, user.id);
  const signedUrl = new URL(`/api/member/resources/${resource.id}/file`, request.url);
  signedUrl.searchParams.set("token", token);

  return new Response(null, {
    status: 302,
    headers: {
      Location: signedUrl.toString(),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Signed-Url-Expires": String(expires),
    },
  });
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
