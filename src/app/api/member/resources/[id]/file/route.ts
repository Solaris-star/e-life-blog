import fs from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { requireApiActiveSubscription } from "@/lib/member-auth";
import { canAccessResource, getMemberResourceById } from "@/lib/member-data";
import { verifySignedResourceToken } from "@/lib/signed-url";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiActiveSubscription();
  if (user instanceof Response) return withPrivateCache(user);

  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");
  const signed = token ? verifySignedResourceToken(token) : null;
  const resource = getMemberResourceById(id);

  if (!resource || !signed || signed.resourceId !== resource.id || signed.userId !== user.id) {
    return Response.json({ error: "下载链接不可用或已过期。" }, { status: 403, headers: privateCacheHeaders() });
  }

  if (!canAccessResource(user, resource)) {
    return Response.json({ error: "当前方案不能下载这份资料。" }, { status: 403, headers: privateCacheHeaders() });
  }

  const privateRoot = path.join(process.cwd(), "member-private", "resources");
  const resolvedPath = path.resolve(resource.filePath);
  if (!resolvedPath.startsWith(path.resolve(privateRoot) + path.sep) || !fs.existsSync(resolvedPath)) {
    return Response.json({ error: "资料文件不可用。" }, { status: 404, headers: privateCacheHeaders() });
  }

  const buffer = await readFile(resolvedPath);
  const filename = `${resource.id}.md`;

  return new Response(buffer, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
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
