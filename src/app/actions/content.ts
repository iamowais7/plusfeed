"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateContentSchema, UpdateContentSchema } from "@/lib/validations";
import { createContent, updateContent, deleteContent } from "@/services/content";

export async function createContentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const rawTags = formData.get("tags") as string;
  const tags = rawTags ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const parsed = CreateContentSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    description: formData.get("description") || undefined,
    thumbnail: formData.get("thumbnail") || undefined,
    url: formData.get("url"),
    tags,
    published: formData.get("published") === "true",
    authorName: formData.get("authorName") || undefined,
    updateSlug: false,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await createContent(parsed.data);
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function updateContentAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  const rawTags = formData.get("tags") as string;
  const tags = rawTags ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const parsed = UpdateContentSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    description: formData.get("description") || undefined,
    thumbnail: formData.get("thumbnail") || undefined,
    url: formData.get("url"),
    tags,
    published: formData.get("published") === "true",
    authorName: formData.get("authorName") || undefined,
    updateSlug: formData.get("updateSlug") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await updateContent(id, parsed.data);
  revalidatePath("/admin/content");
  revalidatePath(`/content`);
  redirect("/admin/content");
}

export async function deleteContentAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  await deleteContent(id);
  revalidatePath("/admin/content");
  revalidatePath("/feed");
}
