import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

export default function MyBooks() {
  return (
    <>
      <PageMeta
        title="My Books | VoteSense - Admin Dashboard"
        description="Manage your personal book collection."
      />
      <PageBreadcrumb pageTitle="My Books" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          My Books
        </h3>
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-white/70">
            Welcome to your personal book collection page. Here you can view, add, and manage your favorite books.
          </p>
          {/* Placeholder for book list or grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Example book cards can be added here */}
          </div>
        </div>
      </div>
    </>
  );
}
