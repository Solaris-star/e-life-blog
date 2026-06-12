"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/member-auth";
import { getPostBySlug } from "@/lib/content";
import { setPostActivity } from "@/lib/member-post-activity";

export async function toggleBookmark(formData: FormData) {
  await toggleActivity(formData, "bookmark");
}

export async function toggleReadLater(formData: FormData) {
  await toggleActivity(formData, "read_later");
}

async function toggleActivity(formData: FormData, type: "bookmark" | "read_later") {
  const slug = String(formData.get("slug") || "").trim();
  const enabled = String(formData.get("enabled") || "") === "true";
  if (!slug) return;
  const post = getPostBySlug(slug);
  if (!post) return;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/articles/${post.slug}`)}`);
  }

  await setPostActivity({ userId: user.id, slug: post.slug, type, enabled });
  revalidatePath(`/articles/${post.slug}`);
  revalidatePath("/account");
  revalidatePath("/member");
}
