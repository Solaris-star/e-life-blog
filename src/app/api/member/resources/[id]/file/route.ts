export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ error: "会员资料库暂未开放。" }, { status: 404 });
}
