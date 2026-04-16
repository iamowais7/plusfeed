import ContentForm from "@/components/admin/ContentForm";

export default function NewContentPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Create New Content
      </h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <ContentForm />
      </div>
    </div>
  );
}
