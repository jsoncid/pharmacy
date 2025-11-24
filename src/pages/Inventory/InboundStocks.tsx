import { useEffect, useState } from "react";
import { Databases, Functions, ID, Query, ExecutionMethod } from "appwrite";
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
import Select from "../../components/form/Select";
import Checkbox from "../../components/form/input/Checkbox";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import ProductDescriptionDetails from "../../components/DescriptionHooks/ProductDescriptionDetails";
import DeliveryDescriptionDetails from "../../components/DescriptionHooks/DeliveryDescriptionDetails";

interface InboundItem {
  $id: string;
  deliveries?: string;
  productDescriptions?: string;
  date_expiry?: string;
  lot_no?: string;
  batch_no?: string;
  stocking_unit?: string;
  qty?: number;
  qty_extra?: number;
  status: boolean;
  is_approved?: boolean;
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
  materials?: string;
  sizes?: string;
  capacityVolumes?: string;
  sterilities?: string;
  usabilities?: string;
  straps?: string;
  contents?: string;
  dosageForms?: string;
  containers?: string;
}

interface Category {
  $id: string;
  description: string;
  status: boolean;
}

interface UnitOption {
  $id: string;
  description: string;
  status: boolean;
}

interface User {
  $id: string;
  name: string;
  email: string;
}

const databases = new Databases(client);
const functionsAPI = new Functions(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const DELIVERY_ITEMS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_DELIVERY_ITEMS;
const DELIVERIES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_DELIVERIES;
const PRODUCT_DESCRIPTIONS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCT_DESCRIPTIONS;
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_UNITS;
const CATEGORY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CATEGORIES;
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
const INVENTORIES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_INVENTORIES;
const NOTIFICATIONS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_NOTIFICATIONS;

export default function InboundStocks() {
  const [items, setItems] = useState<InboundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [products, setProducts] = useState<ProductDescription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [materialsData, setMaterialsData] = useState<UnitOption[]>([]);
  const [sizesData, setSizesData] = useState<UnitOption[]>([]);
  const [capacityVolumesData, setCapacityVolumesData] = useState<UnitOption[]>([]);
  const [sterilitiesData, setSterilitiesData] = useState<UnitOption[]>([]);
  const [usabilitiesData, setUsabilitiesData] = useState<UnitOption[]>([]);
  const [strapsData, setStrapsData] = useState<UnitOption[]>([]);
  const [contentsData, setContentsData] = useState<UnitOption[]>([]);
  const [dosageForms, setDosageForms] = useState<UnitOption[]>([]);
  const [containers, setContainers] = useState<UnitOption[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveFormError, setApproveFormError] = useState<string | null>(null);
  const [submittingApprove, setSubmittingApprove] = useState(false);
  const approveModal = useModal(false);
  const [approveItem, setApproveItem] = useState<InboundItem | null>(null);
  const [inventoryStockingUnitId, setInventoryStockingUnitId] = useState("");
  const [qtyBalanceStocking, setQtyBalanceStocking] = useState("");
  const [qtyBalanceDispensing, setQtyBalanceDispensing] = useState("");
  const [inventoryDispensingUnitId, setInventoryDispensingUnitId] =
    useState("");
  const [conversionValue, setConversionValue] = useState("");
  const [sameUnit, setSameUnit] = useState(false);
  const [representatives, setRepresentatives] = useState<User[]>([]);
  const [representativesLoading, setRepresentativesLoading] = useState(false);
  const [representativesError, setRepresentativesError] = useState<
    string | null
  >(null);
  const [selectedRepresentativeId, setSelectedRepresentativeId] =
    useState("");
  const [addMedicalRepresentative, setAddMedicalRepresentative] =
    useState(false);
  const [commissionBase, setCommissionBase] = useState<
    "amount" | "percentage" | ""
  >("");
  const [commissionValue, setCommissionValue] = useState("");

  useEffect(() => {
    const fetchInboundItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const pageLimit = 100;
        let all: InboundItem[] = [];
        let offset = 0;

        for (;;) {
          const res = await databases.listDocuments(
            DATABASE_ID,
            DELIVERY_ITEMS_COLLECTION_ID,
            [
              Query.orderDesc("$createdAt"),
              Query.equal("status", true),
              Query.equal("is_approved", false),
              Query.limit(pageLimit),
              Query.offset(offset),
            ],
          );

          const docs = res.documents as unknown as InboundItem[];
          all = all.concat(docs);

          if (docs.length < pageLimit) {
            break;
          }

          offset += pageLimit;
        }

        setItems(all);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load inbound stock items",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchInboundItems();
    void fetchProducts();
    void fetchCategories();
    void fetchUnits();
    void fetchProductLookups();
    void fetchRepresentatives();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        PRODUCT_DESCRIPTIONS_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.equal("status", true)],
      );
      setProducts(res.documents as unknown as ProductDescription[]);
    } catch {
      // ignore product load errors
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
      const res = await databases.listDocuments(
        DATABASE_ID,
        UNITS_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.equal("status", true)],
      );
      setUnits(res.documents as unknown as UnitOption[]);
    } catch {
      // ignore unit load errors
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
      // ignore lookup errors
    }
  };

  const fetchRepresentatives = async () => {
    try {
      setRepresentativesLoading(true);
      setRepresentativesError(null);
      const response = await functionsAPI.createExecution(
        import.meta.env.VITE_APPWRITE_FUNCTION_USERS_ID,
        "",
        false,
        "/users",
        ExecutionMethod.GET,
        {},
      );
      const result = JSON.parse(response.responseBody ?? "{}");
      if (result.success) {
        setRepresentatives((result.data ?? []) as User[]);
      } else {
        setRepresentatives([]);
        setRepresentativesError(
          typeof result.error === "string"
            ? result.error
            : "Failed to load users",
        );
      }
    } catch (err) {
      setRepresentatives([]);
      setRepresentativesError(
        err instanceof Error ? err.message : "Failed to load users",
      );
    } finally {
      setRepresentativesLoading(false);
    }
  };

  const resetApproveForm = () => {
    setApproveFormError(null);
    setInventoryStockingUnitId("");
    setQtyBalanceStocking("");
    setQtyBalanceDispensing("");
    setInventoryDispensingUnitId("");
    setConversionValue("");
    setSameUnit(false);
    setSelectedRepresentativeId("");
    setAddMedicalRepresentative(false);
    setCommissionBase("");
    setCommissionValue("");
  };

  const openApproveModal = (item: InboundItem) => {
    setApproveItem(item);
    resetApproveForm();
    setInventoryStockingUnitId(item.stocking_unit ?? "");
    const baseQty =
      item.qty !== undefined && item.qty !== null ? item.qty : 0;
    const extraQty =
      item.qty_extra !== undefined && item.qty_extra !== null
        ? item.qty_extra
        : 0;
    const totalQty = baseQty + extraQty;
    setQtyBalanceStocking(totalQty > 0 ? String(totalQty) : "");
    approveModal.openModal();
  };

  const closeApproveModal = () => {
    approveModal.closeModal();
    setApproveItem(null);
    resetApproveForm();
  };

  const handleApprove = async (item: InboundItem) => {
    const stockingUnitId = inventoryStockingUnitId.trim();
    const dispensingUnitId = inventoryDispensingUnitId.trim();

    const qtyStock = qtyBalanceStocking.trim()
      ? Number(qtyBalanceStocking)
      : NaN;
    const qtyDisp = qtyBalanceDispensing.trim()
      ? Number(qtyBalanceDispensing)
      : NaN;
    const convValue = conversionValue.trim() ? Number(conversionValue) : NaN;
    const commValue = commissionValue.trim() ? Number(commissionValue) : NaN;

    if (!sameUnit) {
      if (!stockingUnitId) {
        setApproveFormError("Inventory stocking unit is required.");
        return;
      }
      if (!Number.isFinite(qtyStock) || qtyStock <= 0) {
        setApproveFormError(
          "Qty balance (stocking) must be a positive number.",
        );
        return;
      }
    }
    if (!Number.isFinite(qtyDisp) || qtyDisp <= 0) {
      setApproveFormError(
        "Qty balance (dispensing) must be a positive number.",
      );
      return;
    }
    if (!dispensingUnitId) {
      setApproveFormError("Inventory dispensing unit is required.");
      return;
    }
    if (!sameUnit) {
      if (!Number.isFinite(convValue) || convValue < 1) {
        setApproveFormError("Conversion value must be 1 or higher.");
        return;
      }
    }
    if (addMedicalRepresentative) {
      if (!selectedRepresentativeId.trim()) {
        setApproveFormError("Medical representative is required.");
        return;
      }
      if (!commissionBase) {
        setApproveFormError("Commission base is required.");
        return;
      }
      if (!Number.isFinite(commValue) || commValue < 0) {
        setApproveFormError(
          "Commission value must be zero or a positive number.",
        );
        return;
      }
    }

    setApproveFormError(null);

    let transactionId: string | null = null;
    let transactionIdentefier = false;

    try {
      setSubmittingApprove(true);
      setApprovingId(item.$id);

      const transaction = await databases.createTransaction({
        ttl: 60,
      });
      transactionId = transaction.$id;

      // 1) Create inventory document
      await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: INVENTORIES_COLLECTION_ID,
        documentId: ID.unique(),
        data: {
          deliveryItems: item.$id,
          date_expiry: item.date_expiry ?? null,
          lot_no: item.lot_no ?? null,
          batch_no: item.batch_no ?? null,
          unit_stocking: sameUnit ? null : stockingUnitId,
          qty_balance_stocking: sameUnit ? null : qtyStock,
          qty_balance_dispensing: qtyDisp,
          units_dispensing: dispensingUnitId,
          conversion_value: sameUnit ? null : convValue,
          medical_representative_uid: addMedicalRepresentative
            ? selectedRepresentativeId
            : null,
          commission_base: addMedicalRepresentative ? commissionBase : null,
          commission_value: addMedicalRepresentative ? commValue : null,
        },
        transactionId,
      });

      // 2) Lock the product descriptions after approved
      if (item.productDescriptions) {
        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: PRODUCT_DESCRIPTIONS_COLLECTION_ID,
          documentId: item.productDescriptions,
          data: {
            delivery_lock_status: true,
          },
          transactionId,
        });
      }

      if (addMedicalRepresentative && selectedRepresentativeId.trim()) {
        try {
          await databases.createDocument({
            databaseId: DATABASE_ID,
            collectionId: NOTIFICATIONS_COLLECTION_ID,
            documentId: ID.unique(),
            data: {
              user_id: selectedRepresentativeId,
              title: "Inbound stock item approved",
              message:
                "Your stock request has been approved. The sales incentive for this item will be posted to your account.",
              is_read: false,
            },
            transactionId,
          });
        } catch {
        }
      }

      // // 3) Optionally deactivate the parent delivery if no other items remain
      if (item.deliveries) {
        const remainingForDelivery = items.filter(
          (i) => i.deliveries === item.deliveries && i.$id !== item.$id,
        );

        if (remainingForDelivery.length === 0) {
          await databases.updateDocument({
            databaseId: DATABASE_ID,
            collectionId: DELIVERIES_COLLECTION_ID,
            documentId: item.deliveries,
            data: {
              status: false,
            },
            transactionId,
          });
        }
      }

      if (transactionId) {
        await databases.updateTransaction({
          transactionId,
          commit: true,
        });
        transactionId = null;
        transactionIdentefier = true;
      }

      // 2) Mark delivery item as approved
      const deliveryTx = await databases.createTransaction({
        ttl: 60,
      });
      const deliveryTxId = deliveryTx.$id;

      try {
        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: DELIVERY_ITEMS_COLLECTION_ID,
          documentId: item.$id,
          data: {
            is_approved: true,
            status: false,
          },
          transactionId: deliveryTxId,
        });

        if (transactionId && transactionIdentefier) {
          await databases.updateTransaction({
            transactionId: deliveryTxId,
            commit: true,
          });
        }
      } catch (error) {
        try {
          await databases.updateTransaction({
            transactionId: deliveryTxId,
            rollback: true,
          });
        } catch {
        }
        throw error;
      }

      setItems((prev) => prev.filter((i) => i.$id !== item.$id));
      closeApproveModal();
    } catch (err) {
      if (transactionId) {
        try {
          await databases.updateTransaction({
            transactionId,
            rollback: true,
          });
        } catch {
        }
      }

      const message =
        err instanceof Error ? err.message : "Failed to approve inbound item";
      setError(message);
      setApproveFormError(message);
    } finally {
      setSubmittingApprove(false);
      setApprovingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const product = products.find((p) => p.$id === item.productDescriptions);
    const unit = units.find((u) => u.$id === item.stocking_unit);
    return (
      (product?.name ?? "").toLowerCase().includes(q) ||
      (item.lot_no ?? "").toLowerCase().includes(q) ||
      (item.batch_no ?? "").toLowerCase().includes(q) ||
      (unit?.description ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage) || 1,
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parts = value.split("T");
    return parts[0] || value;
  };

  return (
    <>
      <PageMeta
        title="Inbound Stocks"
        description="Record and review inbound inventory stock entries"
      />
      <PageBreadcrumb pageTitle="Inbound Stocks" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Inbound Stocks
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Review inbound delivery items that are pending approval.
            </p>
          </div>
          <div className="max-w-xs w-full">
            <InputField
              type="text"
              placeholder="Search inbound items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-error-500">{error}</p>}

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Loading inbound stock items...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Delivery
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Product
                      </TableCell>
                      
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Stocking Unit
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Qty
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Qty Extra
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Expiry Date
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Lot / Batch
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
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((item) => (
                        <TableRow key={item.$id}>
                          
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            <DeliveryDescriptionDetails
                              deliveryId={item.deliveries}
                              className="text-xs text-gray-700 dark:text-gray-200"
                            />
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {(() => {
                              const product = products.find((p) => p.$id === item.productDescriptions);
                              return product ? (
                                <ProductDescriptionDetails
                                  record={product}
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
                              ) : "-";
                            })()}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {(() => {
                              const unit = units.find((u) => u.$id === item.stocking_unit);
                              return unit?.description ?? "-";
                            })()}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {item.qty ?? "-"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {item.qty_extra ?? "-"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {formatDate(item.date_expiry)}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {(item.lot_no || "-") +
                              (item.batch_no ? ` / ${item.batch_no}` : "")}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-green-600 hover:bg-green-700"
                              disabled={approvingId === item.$id}
                              onClick={() => openApproveModal(item)}
                            >
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="px-5 py-8 text-center text-gray-600 dark:text-gray-300"
                        >
                          No inbound stock items pending approval
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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

      <Modal
        isOpen={approveModal.isOpen}
        onClose={closeApproveModal}
        className="max-w-3xl w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Approve Inbound Item &amp; Create Inventory
          </h2>
          {approveItem && (
            <Form
              onSubmit={() => {
                void handleApprove(approveItem);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Checkbox
                    label="Stocking Unit is the same with Dispensing Unit"
                    checked={sameUnit}
                    onChange={(checked) => {
                      setSameUnit(checked);
                      if (checked) {
                        let stockQty = qtyBalanceStocking;
                        const stockUnit = inventoryStockingUnitId;

                        // If there is a conversion value > 1, increment stocking qty by 1
                        const conv = Number(conversionValue || "0");
                        if (Number.isFinite(conv) && conv > 1) {
                          const current = Number(stockQty || "0");
                          const next = Number.isFinite(current)
                            ? current + 1
                            : 1;
                          stockQty = String(next);
                        }

                        // Move qty and unit from stocking to dispensing
                        setQtyBalanceDispensing(stockQty);
                        setQtyBalanceStocking("");
                        setInventoryDispensingUnitId(stockUnit);
                        setInventoryStockingUnitId("");

                        // Clear conversion when using same unit
                        setConversionValue("");
                      } else {
                        const dispQty = qtyBalanceDispensing;
                        const dispUnit = inventoryDispensingUnitId;

                        // Move qty and unit back from dispensing to stocking
                        setQtyBalanceStocking(dispQty);
                        setInventoryStockingUnitId(dispUnit);
                        setQtyBalanceDispensing("");
                        setInventoryDispensingUnitId("");
                      }
                    }}
                  />
                </div>
                {!sameUnit && (
                  <div className="space-y-2">
                    <Label htmlFor="inventory-stocking-unit">
                      Inventory Stocking Unit
                    </Label>
                    <Select
                      options={units.map((u) => ({
                        value: u.$id,
                        label: u.description,
                      }))}
                      defaultValue={inventoryStockingUnitId}
                      onChange={(value) => {
                        setInventoryStockingUnitId(value);
                        if (sameUnit) {
                          setInventoryDispensingUnitId(value);
                        }
                      }}
                      disabled
                    />
                  </div>
                )}
                {!sameUnit && (
                  <div className="space-y-2">
                    <Label htmlFor="qty-balance-stocking">
                      Qty Balance (stocking)
                    </Label>
                    <InputField
                      id="qty-balance-stocking"
                      type="number"
                      value={qtyBalanceStocking}
                      onChange={(e) => setQtyBalanceStocking(e.target.value)}
                      disabled
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="inventory-dispensing-unit">
                    Inventory Dispensing Unit
                  </Label>
                  <Select
                    options={units.map((u) => ({
                      value: u.$id,
                      label: u.description,
                    }))}
                    defaultValue={inventoryDispensingUnitId}
                    onChange={(value) => setInventoryDispensingUnitId(value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty-balance-dispensing">
                    Qty Balance (dispensing)
                  </Label>
                  <InputField
                    id="qty-balance-dispensing"
                    type="number"
                    value={qtyBalanceDispensing}
                    onChange={(e) => setQtyBalanceDispensing(e.target.value)}
                    disabled
                  />
                </div>
                {!sameUnit && (
                  <div className="space-y-2">
                    <Label htmlFor="conversion-value">Conversion Value</Label>
                    <InputField
                      id="conversion-value"
                      type="number"
                      value={conversionValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConversionValue(val);
                        // If cleared, increment stocking qty by 1 and clear dispensing qty
                        if (!val) {
                          setQtyBalanceStocking((prev) => {
                            const current = Number(prev || "0");
                            const next = Number.isFinite(current)
                              ? current + 1
                              : 1;
                            return String(next);
                          });
                          setQtyBalanceDispensing("");
                          return;
                        }

                        if (approveItem) {
                          const baseQty =
                            (approveItem.qty ?? 0) +
                            (approveItem.qty_extra ?? 0);
                          const newStock = baseQty > 0 ? baseQty - 1 : 0;
                          setQtyBalanceStocking(
                            newStock > 0 ? String(newStock) : "0",
                          );
                        }

                        setQtyBalanceDispensing(val);
                      }}
                      min="1"
                    />
                  </div>
                )}
                
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="medical-representative">
                      Medical Representative
                    </Label>
                    <Checkbox
                      label="Add Medical Representative"
                      checked={addMedicalRepresentative}
                      onChange={(checked) => {
                        setAddMedicalRepresentative(checked);
                        if (!checked) {
                          setSelectedRepresentativeId("");
                          setCommissionBase("");
                          setCommissionValue("");
                        }
                      }}
                    />
                  </div>
                  {addMedicalRepresentative && (
                    <>
                      {representativesLoading ? (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Loading users...
                        </p>
                      ) : representatives.length === 0 ? (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          No users available.
                        </p>
                      ) : (
                        <Select
                          options={representatives.map((user) => ({
                            value: user.$id,
                            label: `${user.name} (${user.email})`,
                          }))}
                          defaultValue={selectedRepresentativeId}
                          onChange={(value) =>
                            setSelectedRepresentativeId(value)
                          }
                        />
                      )}
                      {representativesError && (
                        <p className="text-xs text-error-500">
                          {representativesError}
                        </p>
                      )}
                    </>
                  )}
                </div>
                {addMedicalRepresentative && (
                  <>
                    <div className="space-y-2">
                      <Label>Commission Base</Label>
                      <div className="flex gap-4">
                        <Checkbox
                          label="Amount"
                          checked={commissionBase === "amount"}
                          onChange={(checked) =>
                            setCommissionBase(checked ? "amount" : "")
                          }
                        />
                        <Checkbox
                          label="Percentage"
                          checked={commissionBase === "percentage"}
                          onChange={(checked) =>
                            setCommissionBase(checked ? "percentage" : "")
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commission-value">Commission Value</Label>
                      <InputField
                        id="commission-value"
                        type="number"
                        value={commissionValue}
                        onChange={(e) => setCommissionValue(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
              {approveFormError && (
                <p className="text-sm text-error-500">{approveFormError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={closeApproveModal}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-green-600 hover:bg-green-700"
                  type="submit"
                  disabled={submittingApprove}
                >
                  Approve
                </Button>
              </div>
            </Form>
          )}
        </div>
      </Modal>
    </>
  );
}
