import { useEffect, useState } from "react";
import { Databases, ID, Query } from "appwrite";
import client from "../../lib/appwrite";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import InputField from "../../components/form/input/InputField";
import Form from "../../components/form/Form";
import Label from "../../components/form/Label";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import SearchableSelect from "../../components/form/SearchableSelect";
import DatePicker from "../../components/form/date-picker";
import Checkbox from "../../components/form/input/Checkbox";
import ProductDescriptionDetails from "../../components/DescriptionHooks/ProductDescriptionDetails";
import { useAuth } from "../../context/AuthContext";

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const DELIVERIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_DELIVERIES;
const DELIVERY_ITEMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_DELIVERY_ITEMS;
const PRODUCT_DESCRIPTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCT_DESCRIPTIONS;
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_UNITS;
const MATERIAL_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_MATERIALS;
const SIZE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_SIZES;
const CAPACITY_VOLUME_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CAPACITY_VOLUMES;
const STERILITY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_STERILITIES;
const USABILITY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_USABILITIES;
const CONTENT_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_CONTENTS;
const STRAP_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_STRAPS;
const DOSAGE_FORM_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_DOSAGE_FORMS;
const CONTAINER_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CONTAINERS;
const CATEGORY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CATEGORIES;

interface Delivery {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  delivery_receipt_no: string;
  delivered_by: string;
  delivered_date: string;
  created_by: string;
  status: boolean;
}

interface ProductDescription {
  $id: string;
  name: string;
  status: boolean;
  categories?: string;
  date_expiry?: string;
  lot_no?: string;
  batch_no?: string;
  stocking_unit?: string;
  qty?: number;
  qty_extra?: number;
}

interface UnitOption {
  $id: string;
  description: string;
  status: boolean;
}

interface Category {
  $id: string;
  description: string;
  status: boolean;
}

interface DeliveryItemDraft {
  productId: string;
  date_expiry?: string;
  lot_no?: string;
  batch_no?: string;
  stocking_unit?: string;
  qty?: number;
  qty_extra?: number;
  is_approved?: boolean;
}

export default function Deliveries() {
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const createModal = useModal(false);
  const editModal = useModal(false);
  const deleteModal = useModal(false);
  const viewModal = useModal(false);

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [deliveryReceiptNo, setDeliveryReceiptNo] = useState("");
  const [deliveredBy, setDeliveredBy] = useState("");
  const [deliveredDate, setDeliveredDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState<ProductDescription[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [units, setUnits] = useState<UnitOption[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  const [materialsData, setMaterialsData] = useState<UnitOption[]>([]);
  const [sizesData, setSizesData] = useState<UnitOption[]>([]);
  const [capacityVolumesData, setCapacityVolumesData] = useState<UnitOption[]>([]);
  const [sterilitiesData, setSterilitiesData] = useState<UnitOption[]>([]);
  const [usabilitiesData, setUsabilitiesData] = useState<UnitOption[]>([]);
  const [strapsData, setStrapsData] = useState<UnitOption[]>([]);
  const [contentsData, setContentsData] = useState<UnitOption[]>([]);
  const [dosageForms, setDosageForms] = useState<UnitOption[]>([]);
  const [containers, setContainers] = useState<UnitOption[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [items, setItems] = useState<DeliveryItemDraft[]>([]);
  const [itemProductId, setItemProductId] = useState("");
  const [itemDateExpiry, setItemDateExpiry] = useState("");
  const [itemLotNo, setItemLotNo] = useState("");
  const [itemBatchNo, setItemBatchNo] = useState("");
  const [itemStockingUnit, setItemStockingUnit] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemQtyExtra, setItemQtyExtra] = useState("");
  const [useItemDateExpiry, setUseItemDateExpiry] = useState(false);
  const [useItemLotNo, setUseItemLotNo] = useState(false);
  const [useItemBatchNo, setUseItemBatchNo] = useState(false);
  const [useItemQtyExtra, setUseItemQtyExtra] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDeliveries();
    void fetchProducts();
    void fetchCategories();
    void fetchUnits();
    void fetchProductLookups();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await databases.listDocuments(
        DATABASE_ID,
        DELIVERIES_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.equal("status", true)],
      );
      setDeliveries(res.documents as unknown as Delivery[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deliveries");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const res = await databases.listDocuments(
        DATABASE_ID,
        PRODUCT_DESCRIPTIONS_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.equal("status", true)],
      );
      setProducts(res.documents as unknown as ProductDescription[]);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductSearch = async (term: string) => {
    const search = term.trim();

    if (!search) {
      await fetchProducts();
      return;
    }

    try {
      setProductsLoading(true);
      setProductsError(null);

      const res = await databases.listDocuments(
        DATABASE_ID,
        PRODUCT_DESCRIPTIONS_COLLECTION_ID,
        [
          Query.orderDesc("$createdAt"),
          Query.equal("status", true),
          Query.contains("name", [search]),
          Query.limit(20),
        ],
      );

      setProducts(res.documents as unknown as ProductDescription[]);
    } catch (err) {
      setProductsError(
        err instanceof Error ? err.message : "Failed to search products",
      );
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        CATEGORY_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.equal("status", true)],
      );
      setCategories(res.documents as unknown as Category[]);
    } catch {
      // ignore category load errors
    }
  };

  const fetchUnits = async () => {
    try {
      setUnitsLoading(true);
      setUnitsError(null);
      const res = await databases.listDocuments(
        DATABASE_ID,
        UNITS_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.equal("status", true)],
      );
      setUnits(res.documents as unknown as UnitOption[]);
    } catch (err) {
      setUnitsError(err instanceof Error ? err.message : "Failed to fetch units");
    } finally {
      setUnitsLoading(false);
    }
  };

  const fetchProductLookups = async () => {
    try {
      const queries = [Query.orderDesc("$createdAt"), Query.equal("status", true)];

      const [
        materialsRes,
        sizesRes,
        capacityVolumesRes,
        sterilitiesRes,
        usabilitiesRes,
        strapsRes,
        contentsRes,
        dosageFormsRes,
        containersRes,
      ] = await Promise.all([
        databases.listDocuments(DATABASE_ID, MATERIAL_COLLECTION_ID, queries),
        databases.listDocuments(DATABASE_ID, SIZE_COLLECTION_ID, queries),
        databases.listDocuments(
          DATABASE_ID,
          CAPACITY_VOLUME_COLLECTION_ID,
          queries,
        ),
        databases.listDocuments(DATABASE_ID, STERILITY_COLLECTION_ID, queries),
        databases.listDocuments(DATABASE_ID, USABILITY_COLLECTION_ID, queries),
        databases.listDocuments(DATABASE_ID, STRAP_COLLECTION_ID, queries),
        databases.listDocuments(DATABASE_ID, CONTENT_COLLECTION_ID, queries),
        databases.listDocuments(DATABASE_ID, DOSAGE_FORM_COLLECTION_ID, queries),
        databases.listDocuments(DATABASE_ID, CONTAINER_COLLECTION_ID, queries),
      ]);

      setMaterialsData(materialsRes.documents as unknown as UnitOption[]);
      setSizesData(sizesRes.documents as unknown as UnitOption[]);
      setCapacityVolumesData(
        capacityVolumesRes.documents as unknown as UnitOption[],
      );
      setSterilitiesData(sterilitiesRes.documents as unknown as UnitOption[]);
      setUsabilitiesData(usabilitiesRes.documents as unknown as UnitOption[]);
      setStrapsData(strapsRes.documents as unknown as UnitOption[]);
      setContentsData(contentsRes.documents as unknown as UnitOption[]);
      setDosageForms(dosageFormsRes.documents as unknown as UnitOption[]);
      setContainers(containersRes.documents as unknown as UnitOption[]);
    } catch {
    }
  };

  const resetForm = () => {
    setDeliveryReceiptNo("");
    setDeliveredBy("");
    setDeliveredDate("");
    setItems([]);
    setItemProductId("");
    setItemDateExpiry("");
    setItemLotNo("");
    setItemBatchNo("");
    setItemStockingUnit("");
    setItemQty("");
    setItemQtyExtra("");
    setUseItemDateExpiry(false);
    setUseItemLotNo(false);
    setUseItemBatchNo(false);
    setUseItemQtyExtra(false);
    setItemsError(null);
    setFormError(null);
    setSubmitting(false);
  };

  const openCreateModal = () => {
    setSelectedDelivery(null);
    resetForm();
    createModal.openModal();
  };

  const openEditModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    resetForm();
    setDeliveryReceiptNo(delivery.delivery_receipt_no ?? "");
    setDeliveredBy(delivery.delivered_by ?? "");
    setDeliveredDate(delivery.delivered_date ?? "");
    void loadDeliveryItems(delivery.$id);
    editModal.openModal();
  };

  const openDeleteModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setFormError(null);
    setSubmitting(false);
    deleteModal.openModal();
  };

  const openViewModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setItems([]);
    void loadDeliveryItems(delivery.$id, true);
    viewModal.openModal();
  };

  const closeAllModals = () => {
    createModal.closeModal();
    editModal.closeModal();
    deleteModal.closeModal();
    viewModal.closeModal();
    setSelectedDelivery(null);
    setFormError(null);
    setSubmitting(false);
  };

  const loadDeliveryItems = async (
    deliveryId: string,
    includeInactive = false,
  ) => {
    try {
      const queries = [Query.equal("deliveries", deliveryId)];
      if (!includeInactive) {
        queries.push(Query.equal("status", true));
      }

      const res = await databases.listDocuments(
        DATABASE_ID,
        DELIVERY_ITEMS_COLLECTION_ID,
        queries,
      );
      const mapped: DeliveryItemDraft[] = res.documents.map((doc: any) => ({
        productId: (doc as any).productDescriptions as string,
        date_expiry: (doc as any).date_expiry ?? undefined,
        lot_no: (doc as any).lot_no ?? undefined,
        batch_no: (doc as any).batch_no ?? undefined,
        stocking_unit: (doc as any).stocking_unit ?? undefined,
        qty:
          (doc as any).qty !== undefined && (doc as any).qty !== null
            ? Number((doc as any).qty)
            : undefined,
        qty_extra:
          (doc as any).qty_extra !== undefined && (doc as any).qty_extra !== null
            ? Number((doc as any).qty_extra)
            : undefined,
        is_approved: (doc as any).is_approved ?? undefined,
      }));
      setItems(mapped);
    } catch {
      // ignore item load errors
    }
  };

  const handleAddItem = () => {
    if (!itemProductId) {
      setItemsError("Please select a product.");
      return;
    }
    if (!itemStockingUnit) {
      setItemsError("Please select a stocking unit.");
      return;
    }
    const baseQty = itemQty.trim() ? Number(itemQty) : undefined;
    const extraQty =
      useItemQtyExtra && itemQtyExtra.trim()
        ? Number(itemQtyExtra)
        : undefined;
    const baseValid =
      baseQty !== undefined && Number.isFinite(baseQty) && baseQty > 0;
    const extraValid =
      extraQty !== undefined && Number.isFinite(extraQty) && extraQty > 0;

    if (!baseValid && !extraValid) {
      setItemsError("Qty or Qty Extra must be a positive number.");
      return;
    }
    setItemsError(null);
    setItems((prev) => [
      ...prev,
      {
        productId: itemProductId,
        date_expiry: useItemDateExpiry ? itemDateExpiry || undefined : undefined,
        lot_no: useItemLotNo ? itemLotNo || undefined : undefined,
        batch_no: useItemBatchNo ? itemBatchNo || undefined : undefined,
        stocking_unit: itemStockingUnit || undefined,
        qty: baseQty,
        qty_extra: extraQty,
      },
    ]);
    setItemProductId("");
    setItemDateExpiry("");
    setItemLotNo("");
    setItemBatchNo("");
    setItemStockingUnit("");
    setItemQty("");
    setItemQtyExtra("");
    setUseItemDateExpiry(false);
    setUseItemLotNo(false);
    setUseItemBatchNo(false);
    setUseItemQtyExtra(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validateDeliveryForm = () => {
    if (!deliveryReceiptNo.trim()) {
      setFormError("Delivery receipt no is required.");
      return false;
    }
    if (!deliveredBy.trim()) {
      setFormError("Delivered by is required.");
      return false;
    }
    if (!deliveredDate) {
      setFormError("Delivered date is required.");
      return false;
    }
    if (items.length === 0) {
      setItemsError("Add at least one product to this delivery.");
      return false;
    }
    setFormError(null);
    setItemsError(null);
    return true;
  };

  async function runInTransaction<T>(
    work: (transactionId: string) => Promise<T>,
  ): Promise<T> {
    const tx = await databases.createTransaction({ ttl: 60 });
    const transactionId = (tx as any).$id as string;

    try {
      const result = await work(transactionId);
      await databases.updateTransaction({
        transactionId,
        commit: true,
        rollback: false,
      });
      return result;
    } catch (error) {
      try {
        await databases.updateTransaction({
          transactionId,
          commit: false,
          rollback: true,
        });
      } catch {
        // ignore rollback errors
      }
      throw error;
    }
  }

  const createOrReplaceItems = async (
    deliveryId: string,
    transactionId: string,
  ) => {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      DELIVERY_ITEMS_COLLECTION_ID,
      [Query.equal("deliveries", deliveryId), Query.equal("status", true)],
    );
    await Promise.all(
      existing.documents.map((doc: any) =>
        databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: DELIVERY_ITEMS_COLLECTION_ID,
          documentId: doc.$id,
          data: {
            status: false,
          },
          transactionId,
        }),
      ),
    );
    await Promise.all(
      items.map((item) =>
        databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: DELIVERY_ITEMS_COLLECTION_ID,
          documentId: ID.unique(),
          data: {
            deliveries: deliveryId,
            productDescriptions: item.productId,
            date_expiry: item.date_expiry,
            lot_no: item.lot_no,
            batch_no: item.batch_no,
            stocking_unit: item.stocking_unit,
            qty: item.qty,
            qty_extra: item.qty_extra,
            status: true,
          },
          transactionId,
        }),
      ),
    );
  };

  const handleCreateSubmit = async () => {
    if (!validateDeliveryForm()) return;
    if (!user) {
      setFormError("Unable to determine current user.");
      return;
    }
    try {
      setSubmitting(true);
      const deliveryDoc = await runInTransaction(async (transactionId) => {
        const deliveryId = ID.unique();
        const created = await databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: DELIVERIES_COLLECTION_ID,
          documentId: deliveryId,
          data: {
            delivery_receipt_no: deliveryReceiptNo.trim(),
            delivered_by: deliveredBy.trim(),
            delivered_date: deliveredDate,
            created_by: user.$id,
            status: true,
          },
          transactionId,
        });

        await createOrReplaceItems(deliveryId, transactionId);
        return created;
      });

      setDeliveries((prev) => [deliveryDoc as unknown as Delivery, ...prev]);
      closeAllModals();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedDelivery) return;
    if (!validateDeliveryForm()) return;
    try {
      setSubmitting(true);
      const updated = await runInTransaction(async (transactionId) => {
        const updatedDoc = await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: DELIVERIES_COLLECTION_ID,
          documentId: selectedDelivery.$id,
          data: {
            delivery_receipt_no: deliveryReceiptNo.trim(),
            delivered_by: deliveredBy.trim(),
            delivered_date: deliveredDate,
            status: true,
          },
          transactionId,
        });

        await createOrReplaceItems(selectedDelivery.$id, transactionId);
        return updatedDoc;
      });

      setDeliveries((prev) =>
        prev.map((d) => (d.$id === selectedDelivery.$id ? (updated as unknown as Delivery) : d)),
      );
      closeAllModals();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDelivery) return;
    try {
      setSubmitting(true);
      await runInTransaction(async (transactionId) => {
        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: DELIVERIES_COLLECTION_ID,
          documentId: selectedDelivery.$id,
          data: { status: false },
          transactionId,
        });

        const existing = await databases.listDocuments(
          DATABASE_ID,
          DELIVERY_ITEMS_COLLECTION_ID,
          [Query.equal("deliveries", selectedDelivery.$id), Query.equal("status", true)],
        );

        await Promise.all(
          existing.documents.map((doc: any) =>
            databases.updateDocument({
              databaseId: DATABASE_ID,
              collectionId: DELIVERY_ITEMS_COLLECTION_ID,
              documentId: doc.$id,
              data: { status: false },
              transactionId,
            }),
          ),
        );
      });

      setDeliveries((prev) => prev.filter((d) => d.$id !== selectedDelivery.$id));
      closeAllModals();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to deactivate delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDeliveredDate = (value: string) => {
    if (!value) return "-";
    const parts = value.split("T");
    return parts[0] || value;
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.delivery_receipt_no ?? "").toLowerCase().includes(q) ||
      (d.delivered_by ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredDeliveries.length / itemsPerPage) || 1);
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <>
      <PageMeta title="Deliveries" description="Manage deliveries and their products" />
      <PageBreadcrumb pageTitle="Deliveries" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deliveries</h1>
          <Button
            size="sm"
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={openCreateModal}
          >
            Add Delivery
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="max-w-xs w-full">
            <InputField
              type="text"
              placeholder="Search deliveries..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
        </div>

        {error && <p className="text-sm text-error-500">{error}</p>}

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">Loading deliveries...</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Delivery Receipt No
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Delivered By
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Delivered Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {paginatedDeliveries.length > 0 ? (
                    paginatedDeliveries.map((delivery) => (
                      <TableRow key={delivery.$id}>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {delivery.delivery_receipt_no}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {delivery.delivered_by}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {formatDeliveredDate(delivery.delivered_date)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewModal(delivery)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => openEditModal(delivery)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-gray-500 hover:bg-gray-600"
                              onClick={() => openDeleteModal(delivery)}
                            >
                              Deactivate
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="px-5 py-8 text-center text-gray-600 dark:text-gray-300"
                      >
                        No deliveries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Delivery Modal */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={closeAllModals}
        className="max-w-7xl w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Delivery
          </h2>
          <DeliveryForm
            mode="create"
            deliveryReceiptNo={deliveryReceiptNo}
            setDeliveryReceiptNo={setDeliveryReceiptNo}
            deliveredBy={deliveredBy}
            setDeliveredBy={setDeliveredBy}
            deliveredDate={deliveredDate}
            setDeliveredDate={setDeliveredDate}
            products={products}
            productsLoading={productsLoading}
            productsError={productsError}
            units={units}
            unitsLoading={unitsLoading}
            unitsError={unitsError}
            materialsData={materialsData}
            sizesData={sizesData}
            capacityVolumesData={capacityVolumesData}
            sterilitiesData={sterilitiesData}
            usabilitiesData={usabilitiesData}
            strapsData={strapsData}
            contentsData={contentsData}
            dosageForms={dosageForms}
            containers={containers}
            categories={categories}
            items={items}
            itemProductId={itemProductId}
            setItemProductId={setItemProductId}
            itemDateExpiry={itemDateExpiry}
            setItemDateExpiry={setItemDateExpiry}
            useItemDateExpiry={useItemDateExpiry}
            setUseItemDateExpiry={setUseItemDateExpiry}
            itemLotNo={itemLotNo}
            setItemLotNo={setItemLotNo}
            useItemLotNo={useItemLotNo}
            setUseItemLotNo={setUseItemLotNo}
            itemBatchNo={itemBatchNo}
            setItemBatchNo={setItemBatchNo}
            useItemBatchNo={useItemBatchNo}
            setUseItemBatchNo={setUseItemBatchNo}
            itemStockingUnit={itemStockingUnit}
            setItemStockingUnit={setItemStockingUnit}
            itemQty={itemQty}
            setItemQty={setItemQty}
            itemQtyExtra={itemQtyExtra}
            setItemQtyExtra={setItemQtyExtra}
            useItemQtyExtra={useItemQtyExtra}
            setUseItemQtyExtra={setUseItemQtyExtra}
            itemsError={itemsError}
            formError={formError}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onProductSearch={handleProductSearch}
            onSubmit={handleCreateSubmit}
            onCancel={closeAllModals}
            submitting={submitting}
          />
        </div>
      </Modal>

      {/* Edit Delivery Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={closeAllModals}
        className="max-w-5xl w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Delivery
          </h2>
          <DeliveryForm
            mode="edit"
            deliveryReceiptNo={deliveryReceiptNo}
            setDeliveryReceiptNo={setDeliveryReceiptNo}
            deliveredBy={deliveredBy}
            setDeliveredBy={setDeliveredBy}
            deliveredDate={deliveredDate}
            setDeliveredDate={setDeliveredDate}
            products={products}
            productsLoading={productsLoading}
            productsError={productsError}
            units={units}
            unitsLoading={unitsLoading}
            unitsError={unitsError}
            materialsData={materialsData}
            sizesData={sizesData}
            capacityVolumesData={capacityVolumesData}
            sterilitiesData={sterilitiesData}
            usabilitiesData={usabilitiesData}
            strapsData={strapsData}
            contentsData={contentsData}
            dosageForms={dosageForms}
            containers={containers}
            categories={categories}
            items={items}
            itemProductId={itemProductId}
            setItemProductId={setItemProductId}
            itemDateExpiry={itemDateExpiry}
            setItemDateExpiry={setItemDateExpiry}
            useItemDateExpiry={useItemDateExpiry}
            setUseItemDateExpiry={setUseItemDateExpiry}
            itemLotNo={itemLotNo}
            setItemLotNo={setItemLotNo}
            useItemLotNo={useItemLotNo}
            setUseItemLotNo={setUseItemLotNo}
            itemBatchNo={itemBatchNo}
            setItemBatchNo={setItemBatchNo}
            useItemBatchNo={useItemBatchNo}
            setUseItemBatchNo={setUseItemBatchNo}
            itemStockingUnit={itemStockingUnit}
            setItemStockingUnit={setItemStockingUnit}
            itemQty={itemQty}
            setItemQty={setItemQty}
            itemQtyExtra={itemQtyExtra}
            setItemQtyExtra={setItemQtyExtra}
            useItemQtyExtra={useItemQtyExtra}
            setUseItemQtyExtra={setUseItemQtyExtra}
            itemsError={itemsError}
            formError={formError}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onProductSearch={handleProductSearch}
            onSubmit={handleEditSubmit}
            onCancel={closeAllModals}
            submitting={submitting}
          />
        </div>
      </Modal>

      {/* View Delivery Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={closeAllModals}
        className="max-w-5xl w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            View Delivery
          </h2>
          {selectedDelivery && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Delivery Receipt No
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedDelivery.delivery_receipt_no}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Delivered By
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedDelivery.delivered_by}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Delivered Date
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDeliveredDate(selectedDelivery.delivered_date)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Products
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          #
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Product
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Stocking Unit
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Qty
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Qty Extra
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Expiry Date
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Lot No
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Batch No
                        </TableCell>

                        <TableCell
                          isHeader
                          className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Approved
                        </TableCell>

                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {items.length > 0 ? (
                        items.map((item, index) => {
                          const product = products.find((p) => p.$id === item.productId);
                          const unit = units.find((u) => u.$id === item.stocking_unit);
                          return (
                            <TableRow key={`${item.productId}-${index}`}>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {index + 1}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {product ? (
                                  <ProductDescriptionDetails
                                    record={product as any}
                                    categories={categories}
                                    materials={materialsData}
                                    sizes={sizesData}
                                    capacityVolumes={capacityVolumesData}
                                    sterilities={sterilitiesData}
                                    usabilities={usabilitiesData}
                                    straps={strapsData}
                                    contents={contentsData}
                                    dosageForms={dosageForms}
                                    containers={containers}
                                    className="text-xs text-gray-700 dark:text-gray-200"
                                  />
                                ) : (
                                  "Unknown product"
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {unit?.description ?? "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {item.qty ?? "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {item.qty_extra ?? "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {item.date_expiry ?? "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {item.lot_no ?? "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {item.batch_no ?? "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                                {item.is_approved === true
                                  ? "Yes"
                                  : item.is_approved === false
                                    ? "No"
                                    : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="px-4 py-6 text-center text-gray-600 text-theme-sm dark:text-gray-300"
                          >
                            No products found for this delivery
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={closeAllModals}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeAllModals}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Delivery
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to deactivate this delivery? It and its items
            will be hidden from the list but can be restored from the database
            later.
          </p>
          {formError && (
            <p className="text-sm text-error-500">{formError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={closeAllModals}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
              disabled={submitting}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface DeliveryFormProps {
  mode: "create" | "edit";
  deliveryReceiptNo: string;
  setDeliveryReceiptNo: (value: string) => void;
  deliveredBy: string;
  setDeliveredBy: (value: string) => void;
  deliveredDate: string;
  setDeliveredDate: (value: string) => void;
  products: ProductDescription[];
  productsLoading: boolean;
  productsError: string | null;
  units: UnitOption[];
  unitsLoading: boolean;
  unitsError: string | null;
  materialsData: UnitOption[];
  sizesData: UnitOption[];
  capacityVolumesData: UnitOption[];
  sterilitiesData: UnitOption[];
  usabilitiesData: UnitOption[];
  strapsData: UnitOption[];
  contentsData: UnitOption[];
  dosageForms: UnitOption[];
  containers: UnitOption[];
  categories: Category[];
  items: DeliveryItemDraft[];
  itemProductId: string;
  setItemProductId: (value: string) => void;
  itemDateExpiry: string;
  setItemDateExpiry: (value: string) => void;
  useItemDateExpiry: boolean;
  setUseItemDateExpiry: (value: boolean) => void;
  itemLotNo: string;
  setItemLotNo: (value: string) => void;
  useItemLotNo: boolean;
  setUseItemLotNo: (value: boolean) => void;
  itemBatchNo: string;
  setItemBatchNo: (value: string) => void;
  useItemBatchNo: boolean;
  setUseItemBatchNo: (value: boolean) => void;
  itemStockingUnit: string;
  setItemStockingUnit: (value: string) => void;
  itemQty: string;
  setItemQty: (value: string) => void;
  itemQtyExtra: string;
  setItemQtyExtra: (value: string) => void;
  useItemQtyExtra: boolean;
  setUseItemQtyExtra: (value: boolean) => void;
  itemsError: string | null;
  formError: string | null;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onProductSearch: (term: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}

const DeliveryForm: React.FC<DeliveryFormProps> = (props) => {
  const {
    mode,
    deliveryReceiptNo,
    setDeliveryReceiptNo,
    deliveredBy,
    setDeliveredBy,
    deliveredDate,
    setDeliveredDate,
    products,
    productsLoading,
    productsError,
    units,
    unitsLoading,
    unitsError,
    materialsData,
    sizesData,
    capacityVolumesData,
    sterilitiesData,
    usabilitiesData,
    strapsData,
    contentsData,
    dosageForms,
    containers,
    categories,
    items,
    itemProductId,
    setItemProductId,
    itemDateExpiry,
    setItemDateExpiry,
    useItemDateExpiry,
    setUseItemDateExpiry,
    itemLotNo,
    setItemLotNo,
    useItemLotNo,
    setUseItemLotNo,
    itemBatchNo,
    setItemBatchNo,
    useItemBatchNo,
    setUseItemBatchNo,
    itemStockingUnit,
    setItemStockingUnit,
    itemQty,
    setItemQty,
    itemQtyExtra,
    setItemQtyExtra,
    useItemQtyExtra,
    setUseItemQtyExtra,
    itemsError,
    formError,
    onAddItem,
    onRemoveItem,
    onProductSearch,
    onSubmit,
    onCancel,
    submitting,
  } = props;

  return (
    <Form
      onSubmit={() => {
        onSubmit();
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="delivery-receipt-no">Delivery Receipt No</Label>
          <InputField
            id="delivery-receipt-no"
            type="text"
            value={deliveryReceiptNo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDeliveryReceiptNo(e.target.value)
            }
            placeholder="Enter delivery receipt number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delivered-by">Delivered By</Label>
          <InputField
            id="delivered-by"
            type="text"
            value={deliveredBy}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDeliveredBy(e.target.value)
            }
            placeholder="Name of person who delivered"
          />
        </div>
        <div className="space-y-2">
          <DatePicker
            id="delivered-date"
            label="Delivered Date"
            defaultDate={deliveredDate || undefined}
            onChange={(_, dateStr) => {
              setDeliveredDate(dateStr as string);
            }}
            placeholder="Select delivered date"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Products
        </h3>
        {productsError && (
          <p className="text-xs text-error-500">{productsError}</p>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-end">
          <div className="md:col-span-4">
            <Label>Product</Label>
            <SearchableSelect
              options={products.map((product) => ({
                value: product.$id,
                label: product.name,
                data: product,
              }))}
              placeholder={
                productsLoading ? "Loading products..." : "Select product"
              }
              defaultValue={itemProductId}
              onChange={(value) => setItemProductId(value)}
              onSearchChange={onProductSearch}
              renderSelected={(option) => {
                if (!option || !option.data) {
                  return productsLoading ? "Loading products..." : "Select product";
                }

                const product = option.data as ProductDescription;

                return (
                  <ProductDescriptionDetails
                    record={product as any}
                    categories={categories}
                    materials={materialsData}
                    sizes={sizesData}
                    capacityVolumes={capacityVolumesData}
                    sterilities={sterilitiesData}
                    usabilities={usabilitiesData}
                    straps={strapsData}
                    contents={contentsData}
                    dosageForms={dosageForms}
                    containers={containers}
                    className="text-xs text-gray-700 dark:text-gray-200"
                  />
                );
              }}
              renderOption={(option) => {
                if (!option.data) return <span className="truncate">{option.label}</span>;

                const product = option.data as ProductDescription;

                return (
                  <ProductDescriptionDetails
                    record={product as any}
                    categories={categories}
                    materials={materialsData}
                    sizes={sizesData}
                    capacityVolumes={capacityVolumesData}
                    sterilities={sterilitiesData}
                    usabilities={usabilitiesData}
                    straps={strapsData}
                    contents={contentsData}
                    dosageForms={dosageForms}
                    containers={containers}
                    className="text-xs text-gray-700 dark:text-gray-200"
                  />
                );
              }}
              disabled={productsLoading}
            />
          </div>
          
          <div className="md:col-span-3">
            <Label>Stocking Unit</Label>
            <SearchableSelect
              options={units.map((u) => ({ value: u.$id, label: u.description }))}
              placeholder={unitsLoading ? "Loading units..." : "Select unit"}
              defaultValue={itemStockingUnit}
              onChange={(value) => setItemStockingUnit(value)}
              disabled={unitsLoading}
            />
            {unitsError && (
              <p className="mt-1 text-xs text-error-500">{unitsError}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="delivery-item-qty-main">Qty</Label>
            <InputField
              id="delivery-item-qty-main"
              type="number"
              value={itemQty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setItemQty(e.target.value)
              }
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Checkbox
              label="Qty Extra"
              checked={useItemQtyExtra}
              onChange={(checked) => {
                setUseItemQtyExtra(checked);
                if (!checked) {
                  setItemQtyExtra("");
                }
              }}
            />
            {useItemQtyExtra && (
              <InputField
                id="delivery-item-qty-extra"
                type="number"
                value={itemQtyExtra}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setItemQtyExtra(e.target.value)
                }
              />
            )}
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <Checkbox
              label="Expiry Date"
              checked={useItemDateExpiry}
              onChange={(checked) => {
                setUseItemDateExpiry(checked);
                if (!checked) {
                  setItemDateExpiry("");
                }
              }}
            />
            {useItemDateExpiry && (
              <DatePicker
                id="delivery-item-date-expiry"
                label=""
                defaultDate={itemDateExpiry || undefined}
                onChange={(_, dateStr) => {
                  setItemDateExpiry(dateStr as string);
                }}
                placeholder="Select expiry date"
              />
            )}
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <Checkbox
              label="Lot No"
              checked={useItemLotNo}
              onChange={(checked) => {
                setUseItemLotNo(checked);
                if (!checked) {
                  setItemLotNo("");
                }
              }}
            />
            {useItemLotNo && (
              <InputField
                id="delivery-item-lot-no"
                type="text"
                value={itemLotNo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setItemLotNo(e.target.value)
                }
              />
            )}
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <Checkbox
              label="Batch No"
              checked={useItemBatchNo}
              onChange={(checked) => {
                setUseItemBatchNo(checked);
                if (!checked) {
                  setItemBatchNo("");
                }
              }}
            />
            {useItemBatchNo && (
              <InputField
                id="delivery-item-batch-no"
                type="text"
                value={itemBatchNo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setItemBatchNo(e.target.value)
                }
              />
            )}
          </div>
          
          <div className="md:col-span-2 flex md:justify-end">
            <Button
              size="sm"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
              type="button"
              onClick={onAddItem}
            >
              Add Product
            </Button>
          </div>
        </div>
        {itemsError && (
          <p className="text-xs text-error-500">{itemsError}</p>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Product
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Stocking Unit
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Qty
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Qty Extra
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Expiry Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Lot No
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Batch No
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.length > 0 ? (
                items.map((item, index) => {
                  const product = products.find((p) => p.$id === item.productId);
                  const unit = units.find((u) => u.$id === item.stocking_unit);
                  return (
                    <TableRow key={`${item.productId}-${index}`}>
                      <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                        {index + 1}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                        {product ? (
                          <ProductDescriptionDetails
                            record={product as any}
                            categories={categories}
                            materials={materialsData}
                            sizes={sizesData}
                            capacityVolumes={capacityVolumesData}
                            sterilities={sterilitiesData}
                            usabilities={usabilitiesData}
                            straps={strapsData}
                            contents={contentsData}
                            dosageForms={dosageForms}
                            containers={containers}
                            className="text-xs text-gray-700 dark:text-gray-200"
                          />
                        ) : (
                          "Unknown product"
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                        {unit?.description ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                        {item.qty ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                        {item.qty_extra ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                        {item.date_expiry ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                        {item.lot_no ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                        {item.batch_no ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-red-500 hover:bg-red-600"
                          type="button"
                          onClick={() => onRemoveItem(index)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="px-4 py-6 text-center text-gray-600 text-theme-sm dark:text-gray-300"
                  >
                    No products added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {formError && <p className="text-sm text-error-500">{formError}</p>}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          className="bg-green-600 hover:bg-green-700"
          type="submit"
          disabled={submitting}
        >
          {mode === "create" ? "Save" : "Update"}
        </Button>
      </div>
    </Form>
  );
};
