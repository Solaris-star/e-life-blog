export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json({ error: "会员群组暂未开放。" }, { status: 404 });
}
