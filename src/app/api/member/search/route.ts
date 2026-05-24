import { logMemberAccess } from "@/lib/member-access-log";
import { requireApiActiveSubscription } from "@/lib/member-auth";
import { canAccessResource, memberGroups, memberResources } from "@/lib/member-data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(request: Request) {
  const user = await requireApiActiveSubscription();
  if (user instanceof Response) return withPrivateCache(user);

  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim().toLowerCase() : "";

  await logMemberAccess({ action: "search", userId: user.id, targetId: query || "all" });

  const resourceResults = memberResources
    .filter((resource) => canAccessResource(user, resource))
    .filter((resource) => {
      if (!query) return true;
      return `${resource.title} ${resource.summary} ${resource.type}`.toLowerCase().includes(query);
    })
    .map((resource) => ({
      id: resource.id,
      title: resource.title,
      summary: resource.summary,
      type: resource.type,
    }));

  const groupResults = memberGroups
    .filter((group) => canAccessResource(user, group))
    .filter((group) => {
      if (!query) return true;
      return `${group.title} ${group.summary}`.toLowerCase().includes(query);
    })
    .map((group) => ({
      id: group.id,
      title: group.title,
      summary: group.summary,
      type: "群组",
    }));

  return Response.json(
    { results: [...resourceResults, ...groupResults] },
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
