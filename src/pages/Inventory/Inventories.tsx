import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function Inventories() {
  return (
    <>
      <PageMeta
        title="Inventories"
        description="Manage pharmacy inventory records and movements"
      />
      <PageBreadcrumb pageTitle="Inventories" />

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventories
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Use this section to manage inventory-related activities such as
          inbound stocks.
        </p>
      </div>
    </>
  );
}
