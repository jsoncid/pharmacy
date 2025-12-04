import { useEffect, useState } from "react";
import { Databases, Query, ID, Functions, ExecutionMethod } from "appwrite";
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
import DeliveryDescriptionDetails from "../../components/DescriptionHooks/DeliveryDescriptionDetails";
import ProductDescriptionDetails from "../../components/DescriptionHooks/ProductDescriptionDetails";
import { formatPeso } from "../../components/DescriptionHooks/currencyFormatter";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/form/input/InputField";
import SearchableSelect from "../../components/form/SearchableSelect";
import Form from "../../components/form/Form";
import Label from "../../components/form/Label";
import Alert from "../../components/ui/alert/Alert";

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
const ATC_CODE_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_ATC_CODES;
const PHARMACOLOGICAL_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_PHARMACOLOGICALS;
const UNIT_DOSE_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_UNIT_DOSES;
const MATERIAL_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_MATERIALS;
const SIZE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_SIZES;
const CAPACITY_VOLUME_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CAPACITY_VOLUMES;
const STERILITY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_STERILITIES;
const USABILITY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_USABILITIES;
const CONTENT_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CONTENTS;
const STRAP_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_STRAPS;
const DOSAGE_FORM_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_DOSAGE_FORMS;
const CONTAINER_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CONTAINERS;
const INVENTORIES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_INVENTORIES;
const INVENTORY_DETAILS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_INVENTORY_DETAILS;
const SELLING_PRICES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_SELLING_PRICES;

interface DeliveryItem {
  $id: string;
  deliveries?: string;
  productDescriptions?: string;
  date_expiry?: string;
  lot_no?: string;
  batch_no?: string;
  stocking_unit?: string;
  qty?: number;
  qty_extra?: number;
  price_delivery?: number;
  total_item_amount?: number;
  status?: boolean;
  is_approved?: boolean;
}

interface ProductDescription {
  $id: string;
  name: string;
  status: boolean;
  categories?: string;
  atcCodes?: string;
  pharmacologicals?: string;
  unitDoses?: string;
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

interface UserOption {
  $id: string;
  name: string;
  email: string;
}

export default function Inventories() {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductDescription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [materialsData, setMaterialsData] = useState<UnitOption[]>([]);
  const [sizesData, setSizesData] = useState<UnitOption[]>([]);
  const [capacityVolumesData, setCapacityVolumesData] = useState<UnitOption[]>(
    [],
  );
  const [sterilitiesData, setSterilitiesData] = useState<UnitOption[]>([]);
  const [usabilitiesData, setUsabilitiesData] = useState<UnitOption[]>([]);
  const [strapsData, setStrapsData] = useState<UnitOption[]>([]);
  const [contentsData, setContentsData] = useState<UnitOption[]>([]);
  const [dosageForms, setDosageForms] = useState<UnitOption[]>([]);
  const [containers, setContainers] = useState<UnitOption[]>([]);
  const [medRepUsers, setMedRepUsers] = useState<UserOption[]>([]);
  const [medRepUsersLoading, setMedRepUsersLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const approveModal = useModal(false);
  const mergeModal = useModal(false);
  const medRepModal = useModal(false);
  const [selectedItem, setSelectedItem] = useState<DeliveryItem | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [mergeContext, setMergeContext] = useState<{
    item: DeliveryItem;
    inventoryDetailId: string;
    currentBalance: number;
    currentPrice: number | null;
    inventoryDetails: any[];
    inventories: any[];
    detailPrices: Record<string, number | null>;
  } | null>(null);
  const [medRepValue, setMedRepValue] = useState<string>("");
  const [selectedInventoryDetailIdForMerge, setSelectedInventoryDetailIdForMerge] =
    useState<string | null>(null);
  const [medRepIncentive, setMedRepIncentive] = useState<string>("");
  const [medRepIncentiveValue, setMedRepIncentiveValue] = useState<string>("");
  const [medRepFormError, setMedRepFormError] = useState<string | null>(null);
  const [medRepMode, setMedRepMode] = useState<"merge" | "approve" | null>(
    null,
  );
  const [mergeError, setMergeError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await databases.listDocuments(
          DATABASE_ID,
          DELIVERY_ITEMS_COLLECTION_ID,
          [
            Query.equal("status", true),
            Query.equal("is_approved", false),
            Query.orderDesc("$createdAt"),
          ],
        );
        setItems(res.documents as unknown as DeliveryItem[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load delivery items",
        );
      } finally {
        setLoading(false);
      }
    };

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
        const queries = [
          Query.orderDesc("$createdAt"),
          Query.equal("status", true),
        ];

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
          databases.listDocuments(
            DATABASE_ID,
            STERILITY_COLLECTION_ID,
            queries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            USABILITY_COLLECTION_ID,
            queries,
          ),
          databases.listDocuments(DATABASE_ID, STRAP_COLLECTION_ID, queries),
          databases.listDocuments(DATABASE_ID, CONTENT_COLLECTION_ID, queries),
          databases.listDocuments(
            DATABASE_ID,
            DOSAGE_FORM_COLLECTION_ID,
            queries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            CONTAINER_COLLECTION_ID,
            queries,
          ),
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

    const fetchMedRepUsers = async () => {
      try {
        setMedRepUsersLoading(true);
        const response = await functionsAPI.createExecution(
          import.meta.env.VITE_APPWRITE_FUNCTION_USERS_ID,
          "",
          false,
          "/users",
          ExecutionMethod.GET,
          {},
        );
        const result = JSON.parse(response.responseBody);
        if (result.success) {
          setMedRepUsers((result.data || []) as UserOption[]);
        } else {
          console.error("Error fetching med rep users:", result.error);
          setMedRepUsers([]);
        }
      } catch (err) {
        console.error("Error fetching med rep users:", err);
        setMedRepUsers([]);
      } finally {
        setMedRepUsersLoading(false);
      }
    };

    void fetchItems();
    void fetchProducts();
    void fetchCategories();
    void fetchUnits();
    void fetchProductLookups();
    void fetchMedRepUsers();
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parts = value.split("T");
    return parts[0] || value;
  };

  const handleApprove = async (item: DeliveryItem) => {
    setApproveError(null);
    setError(null);

    try {
      const duplicateQueries: string[] = [Query.equal("status", true)];

      if (item.productDescriptions) {
        duplicateQueries.push(
          Query.equal("productDescriptions", item.productDescriptions),
        );
      }
      if (item.date_expiry) {
        duplicateQueries.push(Query.equal("date_expiry", item.date_expiry));
      }
      if (item.lot_no) {
        duplicateQueries.push(Query.equal("lot_no", item.lot_no));
      }
      if (item.batch_no) {
        duplicateQueries.push(Query.equal("batch_no", item.batch_no));
      }

      if (duplicateQueries.length > 0) {
        const existing = await databases.listDocuments(
          DATABASE_ID,
          INVENTORIES_COLLECTION_ID,
          [...duplicateQueries],
        );

        if (existing.total > 0) {
          const inventories = existing.documents as any[];
          const unitId = item.stocking_unit;

          if (inventories.length > 0 && unitId) {
            const detailsLists = await Promise.all(
              inventories.map((inv: any) =>
                databases.listDocuments(
                  DATABASE_ID,
                  INVENTORY_DETAILS_COLLECTION_ID,
                  [
                    Query.equal("inventories", inv.$id),
                    Query.equal("units", unitId),
                    Query.equal("conversion_level", 1),
                    Query.orderDesc("$createdAt"),
                  ],
                ),
              ),
            );

            const details: any[] = [];
            for (const res of detailsLists) {
              details.push(...(((res as any).documents as any[]) || []));
            }

            if (details.length > 0) {
              const detailPrices: Record<string, number | null> = {};

              try {
                const priceResults = await Promise.all(
                  details.map(async (d: any) => {
                    try {
                      const pricesRes = await databases.listDocuments(
                        DATABASE_ID,
                        SELLING_PRICES_COLLECTION_ID,
                        [
                          Query.equal("inventoryDetails", d.$id),
                          Query.equal("status", true),
                          Query.orderDesc("$createdAt"),
                          Query.limit(1),
                        ],
                      );

                      if (pricesRes.total > 0) {
                        const priceDoc = pricesRes.documents[0] as any;
                        const price =
                          typeof priceDoc.price === "number"
                            ? priceDoc.price
                            : null;
                        return { id: d.$id as string, price };
                      }
                    } catch {}
                    return { id: d.$id as string, price: null };
                  }),
                );

                for (const { id, price } of priceResults) {
                  detailPrices[id] = price;
                }
              } catch {}

              let detailDoc =
                (details.find(
                  (d: any) =>
                    d.units === unitId && d.conversion_level === 1,
                ) as any) ??
                (details.find((d: any) => d.units === unitId) as any) ??
                (details[0] as any);

              const currentBalance =
                (detailDoc && typeof detailDoc.running_balance === "number"
                  ? detailDoc.running_balance
                  : 0) || 0;
              const currentPriceValue =
                typeof detailPrices[String(detailDoc.$id)] === "number"
                  ? (detailPrices[String(detailDoc.$id)] as number)
                  : null;

              setMergeContext({
                item,
                inventoryDetailId: detailDoc.$id as string,
                currentBalance,
                currentPrice: currentPriceValue,
                inventoryDetails: details,
                inventories,
                detailPrices,
              });
              setMergeError(null);
              mergeModal.openModal();
              return;
            }
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to validate or merge inventory data.";
      setApproveError(message);
      setError(message);
      return;
    }

    setSelectedItem(item);
    setSellingPrice(
      item.price_delivery !== undefined && item.price_delivery !== null
        ? String(item.price_delivery)
        : "",
    );
    approveModal.openModal();
  };

  const handleConfirmMerge = async () => {
    if (!mergeContext) return;

    const { item, inventoryDetailId, currentBalance } = mergeContext;

    try {
      setApprovingId(item.$id);
      setMergeError(null);
      setError(null);

      const baseQty = item.qty ?? 0; 
      const extraQty = item.qty_extra ?? 0;
      const runningBalance = currentBalance + baseQty + extraQty;

      await databases.updateDocument(
        DATABASE_ID,
        INVENTORY_DETAILS_COLLECTION_ID,
        inventoryDetailId,
        {
          running_balance: runningBalance,
        },
      );

      setItems((prev) => prev.filter((i) => i.$id !== item.$id));
      mergeModal.closeModal();
      setMergeContext(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to merge inventory data.";
      setMergeError(message);
      setError(message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenMedRepModal = (detail: any) => {
    setSelectedInventoryDetailIdForMerge(detail.$id as string);
    const existingMedRep =
      typeof (detail as any).med_rep === "string" ? (detail as any).med_rep : "";
    setMedRepValue(existingMedRep);
    setMedRepIncentive("");
    setMedRepIncentiveValue("");
    setMedRepFormError(null);
    setMedRepMode("merge");
    mergeModal.closeModal();
    medRepModal.openModal();
  };

  const handleOpenMedRepForApprove = () => {
    if (!selectedItem) return;
    setMedRepValue("");
    setMedRepIncentive("");
    setMedRepIncentiveValue("");
    setMedRepFormError(null);
    setMedRepMode("approve");
    approveModal.closeModal();
    medRepModal.openModal();
  };

  const handleCloseMedRepModal = () => {
    medRepModal.closeModal();
    if (medRepMode === "merge") {
      mergeModal.openModal();
    } else if (medRepMode === "approve") {
      approveModal.openModal();
    }
    setSelectedInventoryDetailIdForMerge(null);
    setMedRepValue("");
    setMedRepMode(null);
  };

  const validateMedRepForm = () => {
    const hasMedRep = medRepValue.trim() !== "";

    if (!hasMedRep) {
      setMedRepFormError(null);
      return true;
    }

    if (!medRepIncentive.trim()) {
      setMedRepFormError("Incentive type is required.");
      return false;
    }

    const valueStr = medRepIncentiveValue.trim();
    const valueNum = valueStr ? Number(valueStr) : NaN;

    if (!Number.isFinite(valueNum) || valueNum < 0) {
      setMedRepFormError("Incentive value must be 0 or greater.");
      return false;
    }

    setMedRepFormError(null);
    return true;
  };

  const handleConfirmMedRepAndMerge = () => {
    if (!validateMedRepForm()) return;
    if (!selectedInventoryDetailIdForMerge) return;
    const inventoryDetailId = selectedInventoryDetailIdForMerge;
    const hasMedRep = medRepValue.trim() !== "";
    const medRep = hasMedRep ? medRepValue : undefined;
    const incentiveType = hasMedRep && medRepIncentive.trim() ? medRepIncentive.trim() : undefined;
    const incentiveValue =
      hasMedRep && medRepIncentiveValue.trim()
        ? Number(medRepIncentiveValue.trim())
        : undefined;
    medRepModal.closeModal();
    setSelectedInventoryDetailIdForMerge(null);
    setMedRepValue("");
    setMedRepIncentive("");
    setMedRepIncentiveValue("");
    setMedRepMode(null);
    setMedRepFormError(null);
    void handleConfirmMergeForDetail(
      inventoryDetailId,
      medRep,
      incentiveType,
      incentiveValue,
    );
  };

  const handleConfirmMedRepAndApprove = () => {
    if (!validateMedRepForm()) return;
    if (!selectedItem) return;
    const hasMedRep = medRepValue.trim() !== "";
    const medRep = hasMedRep ? medRepValue : undefined;
    const incentiveType = hasMedRep && medRepIncentive.trim() ? medRepIncentive.trim() : undefined;
    const incentiveValue =
      hasMedRep && medRepIncentiveValue.trim()
        ? Number(medRepIncentiveValue.trim())
        : undefined;
    medRepModal.closeModal();
    setMedRepValue("");
    setMedRepIncentive("");
    setMedRepIncentiveValue("");
    setMedRepMode(null);
    setMedRepFormError(null);
    void handleConfirmApprove(medRep, incentiveType, incentiveValue);
  };

  const handleConfirmMergeForDetail = async (
    inventoryDetailId: string,
    medRepValueParam?: string,
    medRepIncentiveParam?: string,
    medRepIncentiveValueParam?: number,
  ) => {
    if (!mergeContext) return;
    if (!user) {
      const message = "Unable to determine current user.";
      setMergeError(message);
      setError(message);
      return;
    }

    const { item, inventoryDetails, inventories } = mergeContext;

    const detail = inventoryDetails.find(
      (d: any) => (d as any).$id === inventoryDetailId,
    ) as any;

    const inventory = inventories.find(
      (inv: any) => (inv as any).$id === (detail as any).inventories,
    ) as any;

    const existingDeliveryItems =
      inventory && Array.isArray(inventory.delivery_items)
        ? inventory.delivery_items
        : [];

    const currentBalance =
      (detail && typeof detail.running_balance === "number"
        ? detail.running_balance
        : 0) || 0;

    try {
      setApprovingId(item.$id);
      setMergeError(null);
      setError(null);
      setSuccessMessage(null);

      const baseQty = item.qty ?? 0;
      const extraQty = item.qty_extra ?? 0;
      const runningBalance = currentBalance + baseQty + extraQty;

      let transactionId: string | null = null;

      try {
        const tx = await databases.createTransaction({ ttl: 60 });
        transactionId = (tx as any).$id as string;

        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: DELIVERY_ITEMS_COLLECTION_ID,
          documentId: item.$id,
          data: {
            status: false,
            editable: false,
            is_approved: true,
          } as any,
          transactionId,
        });

        if (item.deliveries) {
          const remainingUnapproved = await databases.listDocuments(
            DATABASE_ID,
            DELIVERY_ITEMS_COLLECTION_ID,
            [
              Query.equal("deliveries", item.deliveries),
              Query.equal("status", true),
              Query.equal("is_approved", false),
            ],
          );

          if (remainingUnapproved.total === 1) {
            await databases.updateDocument({
              databaseId: DATABASE_ID,
              collectionId: DELIVERIES_COLLECTION_ID,
              documentId: item.deliveries,
              data: {
                status: false,
              } as any,
              transactionId,
            });
          }
        }

        const today = new Date().toISOString().split("T")[0];
        const deliveryItemsValue = `${item.$id};${today};${user.$id}`;

        //update inventories
        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: INVENTORIES_COLLECTION_ID,
          documentId: detail.inventories,
          data: {
            delivery_items: [...existingDeliveryItems, deliveryItemsValue],
          },
          transactionId,
        });

        const hasNewMedRep =
          typeof medRepValueParam === "string" &&
          medRepValueParam.trim() !== "";

        const medRepToSave = hasNewMedRep
          ? medRepValueParam.trim()
          : (detail && typeof (detail as any).med_rep === "string"
              ? ((detail as any).med_rep as string)
              : undefined);

        const medRepIncentiveToSave = hasNewMedRep
          ? medRepIncentiveParam && medRepIncentiveParam.trim()
          : (detail && typeof (detail as any).med_rep_incentive === "string"
              ? ((detail as any).med_rep_incentive as string)
              : undefined);

        const medRepIncentiveValueToSave = hasNewMedRep
          ? typeof medRepIncentiveValueParam === "number" &&
            Number.isFinite(medRepIncentiveValueParam) &&
            medRepIncentiveValueParam >= 0
            ? medRepIncentiveValueParam
            : undefined
          : (detail &&
              typeof (detail as any).med_rep_incentive_value === "number" &&
              Number.isFinite((detail as any).med_rep_incentive_value)
              ? ((detail as any).med_rep_incentive_value as number)
              : undefined);

        const inventoryDetailUpdateData: any = {
          running_balance: runningBalance,
        };

        if (medRepToSave !== undefined) {
          inventoryDetailUpdateData.med_rep = medRepToSave;
        }

        if (medRepIncentiveToSave !== undefined) {
          inventoryDetailUpdateData.med_rep_incentive = medRepIncentiveToSave;
        }

        if (medRepIncentiveValueToSave !== undefined) {
          inventoryDetailUpdateData.med_rep_incentive_value =
            medRepIncentiveValueToSave;
        }

        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: INVENTORY_DETAILS_COLLECTION_ID,
          documentId: inventoryDetailId,
          data: inventoryDetailUpdateData,
          transactionId,
        });

        const product = products.find(
          (p) => p.$id === item.productDescriptions,
        );

        if (product) {
          const atcCodeId = product.atcCodes;
          const pharmacologicalId = product.pharmacologicals;
          const unitDoseId = product.unitDoses;
          const dosageFormId = product.dosageForms;
          const containerId = product.containers;
          const materialId = product.materials;
          const sizeId = product.sizes;
          const capacityVolumeId = product.capacityVolumes;
          const sterilityId = product.sterilities;
          const usabilityId = product.usabilities;
          const contentId = product.contents;
          const strapId = product.straps;

          const updates: Promise<unknown>[] = [];

          if (atcCodeId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: ATC_CODE_COLLECTION_ID,
                documentId: atcCodeId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          //start here error dli ma update
          if (pharmacologicalId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: PHARMACOLOGICAL_COLLECTION_ID,
                documentId: pharmacologicalId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (unitDoseId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: UNIT_DOSE_COLLECTION_ID,
                documentId: unitDoseId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (dosageFormId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: DOSAGE_FORM_COLLECTION_ID,
                documentId: dosageFormId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (containerId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: CONTAINER_COLLECTION_ID,
                documentId: containerId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (materialId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: MATERIAL_COLLECTION_ID,
                documentId: materialId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (sizeId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: SIZE_COLLECTION_ID,
                documentId: sizeId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (capacityVolumeId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: CAPACITY_VOLUME_COLLECTION_ID,
                documentId: capacityVolumeId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (sterilityId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: STERILITY_COLLECTION_ID,
                documentId: sterilityId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (usabilityId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: USABILITY_COLLECTION_ID,
                documentId: usabilityId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (contentId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: CONTENT_COLLECTION_ID,
                documentId: contentId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (strapId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: STRAP_COLLECTION_ID,
                documentId: strapId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          

          if (updates.length > 0) {
            await Promise.all(updates);
          }
        }

        await databases.updateTransaction({
          transactionId,
          commit: true,
          rollback: false,
        });
        transactionId = null;
      } catch (innerErr) {
        if (transactionId) {
          try {
            await databases.updateTransaction({
              transactionId,
              commit: false,
              rollback: true,
            });
          } catch {
            // ignore rollback errors
          }
        }
        throw innerErr;
      }

      setItems((prev) => prev.filter((i) => i.$id !== item.$id));
      mergeModal.closeModal();
      setMergeContext(null);
      setSuccessMessage("Inventory merged successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to merge inventory data.";
      setMergeError(message);
      setError(message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleMergeCreateNew = () => {
    if (!mergeContext) return;

    const { item } = mergeContext;

    mergeModal.closeModal();
    setMergeContext(null);
    setMergeError(null);
    setSelectedItem(item);
    setApproveError(null);
    setSellingPrice(
      item.price_delivery !== undefined && item.price_delivery !== null
        ? String(item.price_delivery)
        : "",
    );
    setMedRepValue("");
    setMedRepIncentive("");
    setMedRepIncentiveValue("");
    setMedRepFormError(null);
    setMedRepMode("approve");
    approveModal.openModal();
  };

  const handleConfirmApprove = async (
    medRepValueParam?: string,
    medRepIncentiveParam?: string,
    medRepIncentiveValueParam?: number,
  ) => {
    if (!selectedItem) return;
    if (!user) {
      const message = "Unable to determine current user.";
      setApproveError(message);
      setError(message);
      return;
    }

    const priceValue = sellingPrice.trim();
    const parsedPrice = priceValue ? Number(priceValue) : NaN;
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      const message = "Price must be a positive number.";
      setApproveError(message);
      setError(message);
      return;
    }

    try {
      setApprovingId(selectedItem.$id);
      setApproveError(null);
      setError(null);
      let transactionId: string | null = null;

      try {
        const tx = await databases.createTransaction({ ttl: 60 });
        transactionId = (tx as any).$id as string;

        const today = new Date().toISOString().split("T")[0];
        const deliveryItemsValue = `${selectedItem.$id};${today};${user.$id}`;

        //create inventories
        const inventoryDoc = await databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: INVENTORIES_COLLECTION_ID,
          documentId: ID.unique(),
          data: {
            productDescriptions: selectedItem.productDescriptions ?? null,
            delivery_items: [deliveryItemsValue],
            date_expiry: selectedItem.date_expiry ?? null,
            lot_no: selectedItem.lot_no ?? null,
            batch_no: selectedItem.batch_no ?? null,
          },
          transactionId,
        });

        //create invventory_details
        const baseQty = selectedItem.qty ?? 0;
        const extraQty = selectedItem.qty_extra ?? 0;
        const runningBalance = baseQty + extraQty;

        const inventoryDetailsId = ID.unique();

        const medRepToSave =
          typeof medRepValueParam === "string" &&
          medRepValueParam.trim() !== ""
            ? medRepValueParam.trim()
            : undefined;

        const medRepIncentiveToSave =
          typeof medRepIncentiveParam === "string" &&
          medRepIncentiveParam.trim() !== ""
            ? medRepIncentiveParam.trim()
            : undefined;

        const medRepIncentiveValueToSave =
          typeof medRepIncentiveValueParam === "number" &&
          Number.isFinite(medRepIncentiveValueParam) &&
          medRepIncentiveValueParam >= 0
            ? medRepIncentiveValueParam
            : undefined;

        const inventoryDetailsData: any = {
          inventories: (inventoryDoc as any).$id,
          units: selectedItem.stocking_unit ?? null,
          running_balance: runningBalance,
          conversion_level: 1,
        };

        if (medRepToSave !== undefined) {
          inventoryDetailsData.med_rep = medRepToSave;
        }

        if (medRepIncentiveToSave !== undefined) {
          inventoryDetailsData.med_rep_incentive = medRepIncentiveToSave;
        }

        if (medRepIncentiveValueToSave !== undefined) {
          inventoryDetailsData.med_rep_incentive_value =
            medRepIncentiveValueToSave;
        }

        await databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: INVENTORY_DETAILS_COLLECTION_ID,
          documentId: inventoryDetailsId,
          data: inventoryDetailsData,
          transactionId,
        });

        const product = products.find(
          (p) => p.$id === selectedItem.productDescriptions,
        );

        if (product) {
          const atcCodeId = product.atcCodes;
          const pharmacologicalId = product.pharmacologicals;
          const unitDoseId = product.unitDoses;
          const dosageFormId = product.dosageForms;
          const containerId = product.containers;
          const materialId = product.materials;
          const sizeId = product.sizes;
          const capacityVolumeId = product.capacityVolumes;
          const sterilityId = product.sterilities;
          const usabilityId = product.usabilities;
          const contentId = product.contents;
          const strapId = product.straps;

          const updates: Promise<unknown>[] = [];

          if (atcCodeId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: ATC_CODE_COLLECTION_ID,
                documentId: atcCodeId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (pharmacologicalId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: PHARMACOLOGICAL_COLLECTION_ID,
                documentId: pharmacologicalId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (unitDoseId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: UNIT_DOSE_COLLECTION_ID,
                documentId: unitDoseId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (dosageFormId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: DOSAGE_FORM_COLLECTION_ID,
                documentId: dosageFormId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (containerId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: CONTAINER_COLLECTION_ID,
                documentId: containerId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (materialId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: MATERIAL_COLLECTION_ID,
                documentId: materialId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (sizeId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: SIZE_COLLECTION_ID,
                documentId: sizeId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (capacityVolumeId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: CAPACITY_VOLUME_COLLECTION_ID,
                documentId: capacityVolumeId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (sterilityId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: STERILITY_COLLECTION_ID,
                documentId: sterilityId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (usabilityId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: USABILITY_COLLECTION_ID,
                documentId: usabilityId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (contentId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: CONTENT_COLLECTION_ID,
                documentId: contentId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (strapId) {
            updates.push(
              databases.updateDocument({
                databaseId: DATABASE_ID,
                collectionId: STRAP_COLLECTION_ID,
                documentId: strapId,
                data: {
                  editable: false,
                } as any,
                transactionId,
              }),
            );
          }

          if (updates.length > 0) {
            await Promise.all(updates);
          }
        }

        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: DELIVERY_ITEMS_COLLECTION_ID,
          documentId: selectedItem.$id,
          data: {
            status: false,
            editable: false,
            is_approved: true,
          } as any,
          transactionId,
        });

        if (selectedItem.deliveries) {
          const remainingUnapproved = await databases.listDocuments(
            DATABASE_ID,
            DELIVERY_ITEMS_COLLECTION_ID,
            [
              Query.equal("deliveries", selectedItem.deliveries),
              Query.equal("status", true),
              Query.equal("is_approved", false),
            ],
          );

          if (remainingUnapproved.total === 1) {
            await databases.updateDocument({
              databaseId: DATABASE_ID,
              collectionId: DELIVERIES_COLLECTION_ID,
              documentId: selectedItem.deliveries,
              data: {
                status: false,
              } as any,
              transactionId,
            });
          }
        }

        //create selling_prices
        await databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: SELLING_PRICES_COLLECTION_ID,
          documentId: ID.unique(),
          data: {
            price: parsedPrice,
            inventoryDetails: inventoryDetailsId,
          },
          transactionId,
        });

        await databases.updateTransaction({
          transactionId,
          commit: true,
          rollback: false,
        });
        transactionId = null;
      } catch (innerErr) {
        if (transactionId) {
          try {
            await databases.updateTransaction({
              transactionId,
              commit: false,
              rollback: true,
            });
          } catch {
            // ignore rollback errors
          }
        }
        throw innerErr;
      }

      setItems((prev) => prev.filter((i) => i.$id !== selectedItem.$id));
      setSuccessMessage("Inventory action successful.");
      approveModal.closeModal();
      setSelectedItem(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to approve inbound item";
      setApproveError(message);
      setError(message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleCloseMergeModal = () => {
    mergeModal.closeModal();
    setMergeContext(null);
    setMergeError(null);
  };

  const handleCloseApproveModal = () => {
    approveModal.closeModal();
    setSelectedItem(null);
    setApproveError(null);
    setSellingPrice("");
  };

  return (
    <>
      <PageMeta
        title="Inbound Stocks"
        description="Manage pharmacy inventory records and movements"
      />
      <PageBreadcrumb pageTitle="Inbound Stocks" />

      <div className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          List of Delivery/Incomming Stocks
        </p>

        {successMessage && (
          <Alert
            variant="success"
            title="Inventory create new successful"
            message={successMessage}
            closable
            onClose={() => setSuccessMessage(null)}
          />
        )}

        {error && <p className="text-sm text-error-500">{error}</p>}

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Loading inbound stock items...
            </p>
          </div>
        ) : (
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
                      Price
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Total Amount
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
                  {items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.$id}>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          <DeliveryDescriptionDetails
                            deliveryId={item.deliveries}
                            className="text-xs text-gray-700 dark:text-gray-200"
                          />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {(() => {
                            const product = products.find(
                              (p) => p.$id === item.productDescriptions,
                            );
                            return product ? (
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
                              "-"
                            );
                          })()}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {(() => {
                            const unit = units.find(
                              (u) => u.$id === item.stocking_unit,
                            );
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
                          {formatPeso(item.price_delivery)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {formatPeso(item.total_item_amount)}
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
                            onClick={() => handleApprove(item)}
                            disabled={approvingId === item.$id}
                          >
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={10}
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
        )}
      </div>

      <Modal
        isOpen={mergeModal.isOpen}
        onClose={handleCloseMergeModal}
        className="max-w-5xl w-full p-6"
      >
        <Form
          onSubmit={() => {
            handleMergeCreateNew();
          }}
          className="space-y-4"
        >
          {mergeContext && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                We found an existing inventory record with the same product and details. You can merge the quantities into the existing record or create a new one.
              </h2>
              {(() => {
                const product = products.find(
                  (p) => p.$id === mergeContext.item.productDescriptions,
                );
                return product ? (
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
                    className="mb-3 text-xs text-gray-700 dark:text-gray-200"
                  />
                ) : null;
              })()}
              <div className="mt-1 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                
                {mergeContext.inventories &&
                  mergeContext.inventories.length > 0 && (
                    <div className="mt-4 max-h-[70vh] overflow-y-auto space-y-3">
                      <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Existing inventories and their details
                      </p>
                      {mergeContext.inventories.map((inv: any) => {
                        const detailsForInv =
                          mergeContext.inventoryDetails.filter(
                            (detail: any) => detail.inventories === inv.$id,
                          );

                        if (!detailsForInv.length) return null;

                        return (
                          <div
                            key={inv.$id}
                            className="rounded border border-gray-200 dark:border-gray-700"
                          >
                            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-100">
                                Inventory ID: {inv.$id}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                Expiry: {formatDate(inv.date_expiry)} | Lot: {inv.lot_no || "-"} | Batch: {inv.batch_no || "-"}
                              </p>
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableCell
                                      isHeader
                                      className="px-3 py-2 text-xs font-medium text-gray-500 text-start dark:text-gray-400"
                                    >
                                      Unit
                                    </TableCell>
                                    <TableCell
                                      isHeader
                                      className="px-3 py-2 text-xs font-medium text-gray-500 text-start dark:text-gray-400"
                                    >
                                      Conversion Level
                                    </TableCell>
                                    <TableCell
                                      isHeader
                                      className="px-3 py-2 text-xs font-medium text-gray-500 text-start dark:text-gray-400"
                                    >
                                      Running Balance
                                    </TableCell>
                                    <TableCell
                                      isHeader
                                      className="px-3 py-2 text-xs font-medium text-gray-500 text-start dark:text-gray-400"
                                    >
                                      Current price
                                    </TableCell>
                                    <TableCell
                                      isHeader
                                      className="px-3 py-2 text-xs font-medium text-gray-500 text-start dark:text-gray-400"
                                    >
                                      Med Rep
                                    </TableCell>
                                    <TableCell
                                      isHeader
                                      className="px-3 py-2 text-xs font-medium text-gray-500 text-start dark:text-gray-400"
                                    >
                                      Type
                                    </TableCell>
                                    <TableCell
                                      isHeader
                                      className="px-3 py-2 text-xs font-medium text-gray-500 text-start dark:text-gray-400"
                                    >
                                      Value
                                    </TableCell>
                                    <TableCell
                                      isHeader
                                      className="px-3 py-2 text-xs font-medium text-gray-500 text-start dark:text-gray-400"
                                    >
                                      Actions
                                    </TableCell>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detailsForInv.map((detail: any) => {
                                    const unit = units.find(
                                      (u) => u.$id === detail.units,
                                    );
                                    const runningBalance =
                                      typeof detail.running_balance === "number"
                                        ? detail.running_balance
                                        : "-";
                                    const detailPrice =
                                      mergeContext.detailPrices &&
                                      mergeContext.detailPrices[detail.$id] != null
                                        ? mergeContext.detailPrices[detail.$id]
                                        : null;

                                    const medRepId =
                                      typeof (detail as any).med_rep === "string"
                                        ? ((detail as any).med_rep as string)
                                        : "";
                                    const medRepUser = medRepUsers.find(
                                      (u) => u.$id === medRepId,
                                    );
                                    const medRepDisplay = medRepUser
                                      ? `${medRepUser.name} (${medRepUser.email})`
                                      : medRepId || "-";

                                    const medRepIncentive =
                                      typeof (detail as any).med_rep_incentive === "string"
                                        ? ((detail as any).med_rep_incentive as string)
                                        : "";
                                    const medRepIncentiveLabel =
                                      medRepIncentive === "percent"
                                        ? "Percent"
                                        : medRepIncentive === "amount"
                                          ? "Amount"
                                          : "-";

                                    const medRepIncentiveValue =
                                      typeof (detail as any).med_rep_incentive_value ===
                                      "number"
                                        ? ((detail as any)
                                            .med_rep_incentive_value as number)
                                        : null;

                                    return (
                                      <TableRow key={detail.$id}>
                                        <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                          {unit?.description ?? "-"}
                                        </TableCell>
                                        <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                          {detail.conversion_level ?? "-"}
                                        </TableCell>
                                        <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                          {runningBalance}
                                        </TableCell>
                                        <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                          {detailPrice != null
                                            ? formatPeso(detailPrice)
                                            : "-"}
                                        </TableCell>
                                        <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                          {medRepDisplay}
                                        </TableCell>
                                        <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                          {medRepIncentiveLabel}
                                        </TableCell>
                                        <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                          {medRepIncentiveValue != null
                                            ? medRepIncentiveValue
                                            : "-"}
                                        </TableCell>
                                        <TableCell className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                          <Button
                                            size="sm"
                                            variant="primary"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() =>
                                              handleConfirmMergeForDetail(detail.$id)
                                            }
                                            disabled={approvingId !== null}
                                          >
                                            Merge
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>
          )}
          {mergeError && (
            <p className="text-sm text-error-500">{mergeError}</p>
          )}
          <div className="flex justify-between">
            <Button
              size="sm"
              variant="outline"
              type="submit"
            >
              Create new
            </Button>

          </div>
        </Form>
      </Modal>

      <Modal
        isOpen={medRepModal.isOpen}
        onClose={handleCloseMedRepModal}
        className="max-w-md w-full p-6"
      >
        <Form
          onSubmit={() => {
            if (medRepMode === "merge") {
              handleConfirmMedRepAndMerge();
            } else if (medRepMode === "approve") {
              handleConfirmMedRepAndApprove();
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Medical Representative Information
            </h2>
            <div className="space-y-2">
              <Label htmlFor="med-rep">Name</Label>
              {medRepUsersLoading ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Loading users...
                </p>
              ) : medRepUsers.length === 0 ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  No users available
                </p>
              ) : (
                <SearchableSelect
                  options={medRepUsers.map((user) => ({
                    value: user.$id,
                    label: `${user.name} (${user.email})`,
                  }))}
                  placeholder="Select Med Rep"
                  searchPlaceholder="Search user..."
                  value={medRepValue}
                  onChange={(value) => setMedRepValue(value)}
                />
              )}
            </div>
            {medRepValue.trim() !== "" && (
              <div className="space-y-2">
                <Label htmlFor="med-rep-incentive">Incentive Type</Label>
                <select
                  id="med-rep-incentive"
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  value={medRepIncentive}
                  onChange={(e) => setMedRepIncentive(e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="percent">Percent</option>
                  <option value="amount">Amount</option>
                </select>
                <Label htmlFor="med-rep-incentive-value">Incentive Value (per sale)</Label>
                <InputField
                  id="med-rep-incentive-value"
                  type="number"
                  min="0"
                  step={0.01}
                  value={medRepIncentiveValue}
                  onChange={(e) => setMedRepIncentiveValue(e.target.value)}
                />
              </div>
            )}
            {medRepFormError && (
              <p className="text-sm text-error-500">{medRepFormError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={handleCloseMedRepModal}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                type="submit"
                disabled={approvingId !== null}
              >
                {medRepMode === "approve" ? "Continue Approve" : "Continue Merge"}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        isOpen={approveModal.isOpen}
        onClose={handleCloseApproveModal}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Approve Inbound Item
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to approve this inbound item?
          </p>
          <div className="space-y-2">
            <Label htmlFor="approve-price">Selling Price</Label>
            <InputField
              id="approve-price"
              type="number"
              min="0"
              step={0.01}
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />
          </div>
          {approveError && (
            <p className="text-sm text-error-500">{approveError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCloseApproveModal}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleOpenMedRepForApprove}
              disabled={approvingId !== null || !selectedItem}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
