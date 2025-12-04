import { useEffect, useState } from "react";
import { Databases, Query } from "appwrite";
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
import ProductDescriptionDetails from "../../components/DescriptionHooks/ProductDescriptionDetails";
import { formatPeso } from "../../components/DescriptionHooks/currencyFormatter";

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PRODUCT_DESCRIPTIONS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCT_DESCRIPTIONS;
const CATEGORY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CATEGORIES;
const MATERIAL_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_MATERIALS;
const SIZE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_SIZES;
const CAPACITY_VOLUME_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CAPACITY_VOLUMES;
const STERILITY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_STERILITIES;
const USABILITY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_USABILITIES;
const STRAP_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_STRAPS;
const CONTENT_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CONTENTS;
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
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_UNITS;

interface Inventory {
  $id: string;
  productDescriptions?: string;
  date_expiry?: string;
  lot_no?: string;
  batch_no?: string;
}

interface InventoryDetail {
  $id: string;
  inventories: string;
  units?: string;
  running_balance?: number;
  conversion_level?: number;
}

interface SellingPriceMap {
  [detailId: string]: number | null;
}

interface UnitOption {
  $id: string;
  description: string;
}

interface ProductDescription {
  $id: string;
  name: string;
  categories?: string;
  materials?: string;
  sizes?: string;
  capacityVolumes?: string;
  sterilities?: string;
  usabilities?: string;
  straps?: string;
  contents?: string;
  dosageForms?: string;
  containers?: string;
  unitDoses?: string;
  dosage_strenght?: number;
}

interface Category {
  $id: string;
  description: string;
}

export default function Inventories() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [detailsByInventory, setDetailsByInventory] = useState<
    Record<string, InventoryDetail[]>
  >({});
  const [pricesByDetail, setPricesByDetail] = useState<SellingPriceMap>({});
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [products, setProducts] = useState<ProductDescription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const lookupQueries = [
          Query.orderDesc("$createdAt"),
          Query.equal("status", true),
        ];

        const [
          invRes,
          unitsRes,
          productsRes,
          categoriesRes,
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
          databases.listDocuments(DATABASE_ID, INVENTORIES_COLLECTION_ID, [
            Query.equal("status", true),
            Query.orderAsc("productDescriptions"),
          ]),
          databases.listDocuments(DATABASE_ID, UNITS_COLLECTION_ID, [
            Query.orderDesc("$createdAt"),
          ]),
          databases.listDocuments(
            DATABASE_ID,
            PRODUCT_DESCRIPTIONS_COLLECTION_ID,
            [Query.orderDesc("$createdAt"), Query.equal("status", true)],
          ),
          databases.listDocuments(
            DATABASE_ID,
            CATEGORY_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            MATERIAL_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            SIZE_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            CAPACITY_VOLUME_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            STERILITY_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            USABILITY_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            STRAP_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            CONTENT_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            DOSAGE_FORM_COLLECTION_ID,
            lookupQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            CONTAINER_COLLECTION_ID,
            lookupQueries,
          ),
        ]);

        const invDocs = invRes.documents as any[];
        setInventories(invDocs as Inventory[]);

        const unitDocs = unitsRes.documents as any[];
        setUnits(unitDocs as UnitOption[]);

        setProducts(productsRes.documents as any as ProductDescription[]);
        setCategories(categoriesRes.documents as any as Category[]);
        setMaterialsData(materialsRes.documents as any as UnitOption[]);
        setSizesData(sizesRes.documents as any as UnitOption[]);
        setCapacityVolumesData(
          capacityVolumesRes.documents as any as UnitOption[],
        );
        setSterilitiesData(sterilitiesRes.documents as any as UnitOption[]);
        setUsabilitiesData(usabilitiesRes.documents as any as UnitOption[]);
        setStrapsData(strapsRes.documents as any as UnitOption[]);
        setContentsData(contentsRes.documents as any as UnitOption[]);
        setDosageForms(dosageFormsRes.documents as any as UnitOption[]);
        setContainers(containersRes.documents as any as UnitOption[]);

        const detailMap: Record<string, InventoryDetail[]> = {};
        const priceMap: SellingPriceMap = {};

        await Promise.all(
          invDocs.map(async (inv) => {
            const detailsRes = await databases.listDocuments(
              DATABASE_ID,
              INVENTORY_DETAILS_COLLECTION_ID,
              [
                Query.equal("inventories", inv.$id),
                Query.orderAsc("units"),
                Query.orderDesc("$createdAt"),
              ],
            );

            const details = (detailsRes.documents as any[]) as InventoryDetail[];
            detailMap[inv.$id] = details;

            await Promise.all(
              details.map(async (detail) => {
                try {
                  const pricesRes = await databases.listDocuments(
                    DATABASE_ID,
                    SELLING_PRICES_COLLECTION_ID,
                    [
                      Query.equal("inventoryDetails", detail.$id),
                      Query.orderDesc("$createdAt"),
                      Query.limit(1),
                    ],
                  );
                  if (pricesRes.total > 0) {
                    const priceDoc = pricesRes.documents[0] as any;
                    priceMap[detail.$id] =
                      typeof priceDoc.price === "number"
                        ? (priceDoc.price as number)
                        : null;
                  } else {
                    priceMap[detail.$id] = null;
                  }
                } catch {
                  priceMap[detail.$id] = null;
                }
              }),
            );
          }),
        );

        setDetailsByInventory(detailMap);
        setPricesByDetail(priceMap);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load inventories data",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parts = value.split("T");
    return parts[0] || value;
  };

  const getUnitDescription = (unitId?: string) => {
    if (!unitId) return "-";
    const unit = units.find((u) => u.$id === unitId);
    return unit?.description ?? unitId;
  };

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
          Listing of all inventory records, their details, and current selling
          prices.
        </p>

        {error && <p className="text-sm text-error-500">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Loading inventories...
          </p>
        ) : inventories.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No inventories found.
          </p>
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
                      Product
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Expiry / Lot / Batch
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Detail Unit
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Current Price
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Running Balance
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Med Rep
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {inventories.map((inv) => {
                    const details = detailsByInventory[inv.$id] || [];
                    const product = products.find(
                      (p) => p.$id === (inv as any).productDescriptions,
                    );
                    if (!details.length) {
                      return (
                        <TableRow key={inv.$id}>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
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
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            {formatDate((inv as any).date_expiry)} | {(inv as any).lot_no || "-"} /
                            {(inv as any).batch_no || "-"}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            -
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            -
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            -
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            -
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return details.map((detail, index) => {
                      const price = pricesByDetail[detail.$id] ?? null;
                      const medRepDisplay =
                        typeof (detail as any).med_rep === "string"
                          ? ((detail as any).med_rep as string)
                          : "-";
                      return (
                        <TableRow key={`${inv.$id}-${detail.$id}`}>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            {index === 0 ? (
                              product ? (
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
                              )
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            {index === 0 ? (
                              <>
                                {formatDate((inv as any).date_expiry)} | {(inv as any).lot_no || "-"} /
                                {(inv as any).batch_no || "-"}
                              </>
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            {getUnitDescription(detail.units)}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            {price != null ? formatPeso(price) : "-"}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            {typeof detail.running_balance === "number"
                              ? detail.running_balance
                              : "-"}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-xs text-gray-700 dark:text-gray-200">
                            {medRepDisplay}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
