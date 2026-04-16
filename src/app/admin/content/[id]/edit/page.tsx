import { notFound } from "next/navigation";
import ContentForm from "@/components/admin/ContentForm";
import { getContentById } from "@/services/content";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditContentPage({ params }: Props) {
  const { id } = await params;
  const content = await getContentById(id);
  if (!content) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Edit Content
      </h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <ContentForm
          content={{
            id: content.id,
            title: content.title,
            type: content.type,
            description: content.description,
            thumbnail: content.thumbnail,
            url: content.url,
            tags: content.tags,
            published: content.published,
            authorName: content.authorName,
          }}
        />
      </div>
    </div>
  );
}
