"use client";

import { useActionState } from "react";
import { createContentAction, updateContentAction } from "@/app/actions/content";

interface ContentData {
  id?: string;
  title?: string;
  type?: string;
  description?: string | null;
  thumbnail?: string | null;
  url?: string;
  tags?: string[];
  published?: boolean;
  authorName?: string | null;
}

interface Props {
  content?: ContentData;
}

export default function ContentForm({ content }: Props) {
  const isEdit = !!content?.id;

  const boundAction = isEdit
    ? updateContentAction.bind(null, content!.id!)
    : createContentAction;

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return boundAction(formData);
    },
    null
  );

  type FieldErrors = Record<string, string[]>;
  const errors = (state as { error?: FieldErrors | string } | null)?.error;
  const fieldErrors = typeof errors === "object" && errors !== null ? errors as FieldErrors : {};

  return (
    <form action={formAction} className="space-y-6">
      {typeof errors === "string" && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {errors}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title *
        </label>
        <input
          name="title"
          defaultValue={content?.title}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {fieldErrors.title && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Type *
        </label>
        <select
          name="type"
          defaultValue={content?.type ?? "VIDEO"}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="VIDEO">Video</option>
          <option value="ARTICLE">Article</option>
        </select>
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          URL / Content Body *
        </label>
        <textarea
          name="url"
          defaultValue={content?.url}
          rows={4}
          required
          placeholder="Video URL or article HTML/markdown body"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {fieldErrors.url && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.url[0]}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          name="description"
          defaultValue={content?.description ?? ""}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Thumbnail URL
        </label>
        <input
          name="thumbnail"
          type="url"
          defaultValue={content?.thumbnail ?? ""}
          placeholder="https://..."
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Author Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Author Name
        </label>
        <input
          name="authorName"
          defaultValue={content?.authorName ?? ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags (comma-separated)
        </label>
        <input
          name="tags"
          defaultValue={content?.tags?.join(", ") ?? ""}
          placeholder="tech, programming, web"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Published */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="published"
          id="published"
          value="true"
          defaultChecked={content?.published ?? false}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Published (visible in feed)
        </label>
      </div>

      {/* Update slug (edit only) */}
      {isEdit && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="updateSlug"
            id="updateSlug"
            value="true"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="updateSlug" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Regenerate slug from title (may break existing links)
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Saving..." : isEdit ? "Update Content" : "Create Content"}
      </button>
    </form>
  );
}
