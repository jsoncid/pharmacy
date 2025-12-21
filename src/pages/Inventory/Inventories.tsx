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
import { formatPeso } from "../../components/DescriptionHooks/currencyFormatter";

import ProductDescriptionDetails from "../../components/DescriptionHooks/ProductDescriptionDetails";
import LocationDescriptionDetails from "../../components/DescriptionHooks/LocationDescriptionDetails";
import InputField from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Alert from "../../components/ui/alert/Alert";
import UnorderedList from "../../components/ui/list/UnorderedList";
import SearchableSelectWithAdd from "../../components/form/SearchableSelectWithAdd";
import Form from "../../components/form/Form";
import Label from "../../components/form/Label";

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const INVENTORIES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_INVENTORIES;
const INVENTORY_DETAILS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_INVENTORY_DETAILS;
const SELLING_PRICES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_SELLING_PRICES;
const PRODUCT_DESCRIPTIONS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCT_DESCRIPTIONS;
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_UNITS;
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
const CONTENT_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CONTENTS;
const STRAP_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_STRAPS;
const DOSAGE_FORM_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_DOSAGE_FORMS;
const BRANDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_BRANDS;
const CONTAINER_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CONTAINERS;
const LOCATION_BINS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_bins;
const LOCATION_SHELVES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_shelves;
const LOCATION_RACKS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_racks;
const LOCATION_AISLES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_aisles;

interface InventoryDetail {
  $id: string;
  inventories?: string;
  units?: string;
  running_balance?: number;
  conversion_level?: number;
  locationBins?: string;
  med_rep?: string;
  med_rep_incentive?: string;
  med_rep_incentive_value?: number;
  is_converted?: boolean;
  barcode?: string;
}

interface InventoryRecord {
  $id: string;
  productDescriptions?: string;
  brands?: string;
  date_expiry?: string;
  lot_no?: string;
  batch_no?: string;
  status?: boolean;
}

interface Category {
  $id: string;
  description: string;
  status?: boolean;
}

interface ProductDescription {
  $id: string;
  name: string;
  status?: boolean;
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

interface UnitOption {
  $id: string;
  description: string;
  status?: boolean;
}

interface LocationBin {
  $id: string;
  description: string;
  status?: boolean;
  locationShelves?: string;
  shelfDescription?: string;
  rackDescription?: string;
  aisleDescription?: string;
}

interface LocationShelfLink {
  $id: string;
  description: string;
  status?: boolean;
  locationRacks?: string;
}

interface LocationRackLink {
  $id: string;
  description: string;
  status?: boolean;
  locationAisles?: string;
}

interface LocationAisleLink {
  $id: string;
  description: string;
  status?: boolean;
}

export default function InventoriesPage() {
  const [details, setDetails] = useState<InventoryDetail[]>([]);
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [products, setProducts] = useState<ProductDescription[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materialsData, setMaterialsData] = useState<UnitOption[]>([]);
  const [sizesData, setSizesData] = useState<UnitOption[]>([]);
  const [capacityVolumesData, setCapacityVolumesData] =
    useState<UnitOption[]>([]);
  const [sterilitiesData, setSterilitiesData] = useState<UnitOption[]>([]);
  const [usabilitiesData, setUsabilitiesData] = useState<UnitOption[]>([]);
  const [strapsData, setStrapsData] = useState<UnitOption[]>([]);
  const [contentsData, setContentsData] = useState<UnitOption[]>([]);
  const [brands, setBrands] = useState<UnitOption[]>([]);
  const [dosageForms, setDosageForms] = useState<UnitOption[]>([]);
  const [containers, setContainers] = useState<UnitOption[]>([]);
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationBins, setLocationBins] = useState<LocationBin[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [taggingLocationId, setTaggingLocationId] = useState<string | null>(
    null,
  );
  const [selectedDetailForLocation, setSelectedDetailForLocation] =
    useState<InventoryDetail | null>(null);
  const [locationSuccessMessage, setLocationSuccessMessage] =
    useState<string | null>(null);
  const locationModal = useModal(false);
  const [selectedDetailForBarcode, setSelectedDetailForBarcode] =
    useState<InventoryDetail | null>(null);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [barcodeSuccessMessage, setBarcodeSuccessMessage] =
    useState<string | null>(null);
  const [savingBarcode, setSavingBarcode] = useState(false);
  const barcodeModal = useModal(false);
  const [selectedDetailForDownsize, setSelectedDetailForDownsize] =
    useState<InventoryDetail | null>(null);
  const downsizeModal = useModal(false);
  const [newDetailUnitId, setNewDetailUnitId] = useState("");
  const [newDetailRunningBalance, setNewDetailRunningBalance] = useState("");
  const [downsizedValue, setDownsizedValue] = useState("");
  const [newMedRepIncentiveValue, setNewMedRepIncentiveValue] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [createDetailError, setCreateDetailError] = useState<string | null>(null);
  const [downsizeSuccessMessage, setDownsizeSuccessMessage] =
    useState<string | null>(null);
  const [creatingDetail, setCreatingDetail] = useState(false);
  const createUnitModal = useModal(false);
  const [newUnitDescription, setNewUnitDescription] = useState("");
  const [unitModalError, setUnitModalError] = useState<string | null>(null);
  const [unitModalSubmitting, setUnitModalSubmitting] = useState(false);
  const hasMedRepForDownsize = Boolean(
    selectedDetailForDownsize?.med_rep?.trim(),
  );

  const handleUnitSearch = async (term: string) => {
    const search = term.trim();
    try {
      const queries = [
        Query.orderDesc("$createdAt"),
        Query.equal("status", true),
        Query.limit(20),
      ];

      if (search) {
        queries.splice(2, 0, Query.contains("description", [search]));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        UNITS_COLLECTION_ID,
        queries,
      );
      setUnits(response.documents as unknown as UnitOption[]);
    } catch {
      // ignore lookup errors
    }
  };

  const handleOpenCreateUnitModal = () => {
    setNewUnitDescription("");
    setUnitModalError(null);
    createUnitModal.openModal();
  };

  const handleCreateUnit = async () => {
    if (!newUnitDescription.trim()) {
      setUnitModalError("Description is required.");
      return;
    }

    try {
      setUnitModalSubmitting(true);
      setUnitModalError(null);
      const newUnit = await databases.createDocument(
        DATABASE_ID,
        UNITS_COLLECTION_ID,
        ID.unique(),
        {
          description: newUnitDescription.trim(),
          status: true,
        },
      );

      const typedUnit = newUnit as unknown as UnitOption;
      setUnits((prev) => [typedUnit, ...prev]);
      setNewDetailUnitId(typedUnit.$id);
      createUnitModal.closeModal();
    } catch (err) {
      setUnitModalError(
        err instanceof Error ? err.message : "Failed to create unit.",
      );
    } finally {
      setUnitModalSubmitting(false);
    }
  };

  const handleCreateInventoryDetail = async () => {
    if (!selectedDetailForDownsize) {
      setCreateDetailError("No inventory detail selected.");
      return;
    }

    if (!newDetailUnitId) {
      setCreateDetailError("Please select a unit.");
      return;
    }

    if (hasMedRepForDownsize) {
      const parsedNewIncentive = Number(newMedRepIncentiveValue);
      if (!Number.isFinite(parsedNewIncentive) || parsedNewIncentive <= 0) {
        setCreateDetailError(
          "Med Rep incentive value must be a positive number.",
        );
        return;
      }
    }

    const parsedSellingPrice = Number(newSellingPrice);
    if (!Number.isFinite(parsedSellingPrice) || parsedSellingPrice <= 0) {
      setCreateDetailError("New selling price must be a positive number.");
      return;
    }

    const parsedDownsizeValue = Number(downsizedValue);
    const shouldSubtractOne =
      Number.isFinite(parsedDownsizeValue) && parsedDownsizeValue >= 1;
    const rawOriginalBalance =
      typeof selectedDetailForDownsize.running_balance === "number"
        ? selectedDetailForDownsize.running_balance
        : Number(selectedDetailForDownsize.running_balance);
    const updatedRunningBalance =
      Number.isFinite(rawOriginalBalance)
        ? rawOriginalBalance - (shouldSubtractOne ? 1 : 0)
        : null;

    try {
      setCreatingDetail(true);
      setCreateDetailError(null);

      let typedDetail: InventoryDetail | null = null;

      try {
        await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: INVENTORY_DETAILS_COLLECTION_ID,
          documentId: selectedDetailForDownsize.$id,
          data: {
            is_converted: true,
            ...(updatedRunningBalance !== null
              ? { running_balance: updatedRunningBalance }
              : {}),
          },
        });

        const payload = {
          inventories: selectedDetailForDownsize.inventories ?? null,
          units: newDetailUnitId,
          running_balance: Number(downsizedValue),
          conversion_level: (selectedDetailForDownsize.conversion_level ?? 0) + 1,
          med_rep: selectedDetailForDownsize.med_rep ?? null,
          med_rep_incentive: selectedDetailForDownsize.med_rep_incentive ?? null,
          med_rep_incentive_value: hasMedRepForDownsize
            ? Number(newMedRepIncentiveValue)
            : selectedDetailForDownsize.med_rep_incentive_value ?? null,
        };

        const newDetail = await databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: INVENTORY_DETAILS_COLLECTION_ID,
          documentId: ID.unique(),
          data: payload,
        });

        typedDetail = newDetail as unknown as InventoryDetail;

        await databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: SELLING_PRICES_COLLECTION_ID,
          documentId: ID.unique(),
          data: {
            inventoryDetails: typedDetail.$id,
            price: parsedSellingPrice,
            status: true,
          },
        });

      } catch (innerErr) {
        throw innerErr;
      }

      if (!typedDetail) {
        throw new Error("Failed to create downsized inventory detail.");
      }

      setDetails((prev) => [
        typedDetail,
        ...prev.map((detail) =>
          detail.$id === selectedDetailForDownsize.$id ? { ...selectedDetailForDownsize, is_converted: true, ...(updatedRunningBalance !== null ? { running_balance: updatedRunningBalance } : {}) } : detail,
        ),
      ]);
      setSelectedDetailForDownsize(typedDetail);
      setNewDetailRunningBalance("");
      downsizeModal.closeModal();
      setDownsizeSuccessMessage("Downsizing completed successfully.");
    } catch (err) {
      setCreateDetailError(
        err instanceof Error
          ? err.message
          : "Failed to create inventory detail.",
      );
    } finally {
      setCreatingDetail(false);
    }
  };

  const handleDownsizedValueChange = (value: string) => {
    setDownsizedValue(value);

    const parsedDownsize = Number(value);
    const baseIncentive = getMedRepIncentiveValueNumber(
      selectedDetailForDownsize,
    );
    const originalPrice =
      selectedDetailForDownsize && prices[selectedDetailForDownsize.$id];

    if (
      baseIncentive !== null &&
      Number.isFinite(parsedDownsize) &&
      parsedDownsize > 0
    ) {
      if (getMedRepIncentiveLabel(selectedDetailForDownsize) === "Amount") {
        setNewMedRepIncentiveValue(
          Number(baseIncentive / parsedDownsize).toFixed(2),
        );
      } else if (
        getMedRepIncentiveLabel(selectedDetailForDownsize) === "Percent"
      ) {
        setNewMedRepIncentiveValue(
          Number(baseIncentive).toFixed(0),
        );
      } else {
        setNewMedRepIncentiveValue(value);
      }
    } else {
      setNewMedRepIncentiveValue("");
    }

    if (
      typeof originalPrice === "number" &&
      Number.isFinite(parsedDownsize) &&
      parsedDownsize > 0
    ) {
      setNewSellingPrice((originalPrice / parsedDownsize).toFixed(2));
    } else {
      setNewSellingPrice("");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const pageLimit = 100;
        let allDetails: InventoryDetail[] = [];
        let offset = 0;

        for (;;) {
          const res = await databases.listDocuments(
            DATABASE_ID,
            INVENTORY_DETAILS_COLLECTION_ID,
            [
              Query.orderDesc("$createdAt"),
              Query.limit(pageLimit),
              Query.offset(offset),
            ],
          );

          const docs = res.documents as unknown as InventoryDetail[];
          allDetails = allDetails.concat(docs);

          if (docs.length < pageLimit) {
            break;
          }

          offset += pageLimit;
        }

        setDetails(allDetails);

        const commonQueries = [
          Query.orderDesc("$createdAt"),
          Query.equal("status", true),
        ];

        const [
          inventoriesRes,
          productsRes,
          unitsRes,
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
          brandsRes,
        ] = await Promise.all([
          databases.listDocuments(DATABASE_ID, INVENTORIES_COLLECTION_ID, [
            Query.orderDesc("$createdAt"),
            Query.equal("status", true),
          ]),
          databases.listDocuments(
            DATABASE_ID,
            PRODUCT_DESCRIPTIONS_COLLECTION_ID,
            [Query.orderDesc("$createdAt"), Query.equal("status", true)],
          ),
          databases.listDocuments(DATABASE_ID, UNITS_COLLECTION_ID, [
            Query.orderDesc("$createdAt"),
            Query.equal("status", true),
          ]),
          databases.listDocuments(
            DATABASE_ID,
            CATEGORY_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            MATERIAL_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            SIZE_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            CAPACITY_VOLUME_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            STERILITY_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            USABILITY_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            STRAP_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            CONTENT_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            DOSAGE_FORM_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            CONTAINER_COLLECTION_ID,
            commonQueries,
          ),
          databases.listDocuments(
            DATABASE_ID,
            BRANDS_COLLECTION_ID,
            commonQueries,
          ),
        ]);

        setInventories(
          inventoriesRes.documents as unknown as InventoryRecord[],
        );
        setProducts(productsRes.documents as unknown as ProductDescription[]);
        setUnits(unitsRes.documents as unknown as UnitOption[]);
        setCategories(categoriesRes.documents as unknown as Category[]);
        setMaterialsData(materialsRes.documents as unknown as UnitOption[]);
        setSizesData(sizesRes.documents as unknown as UnitOption[]);
        setCapacityVolumesData(
          capacityVolumesRes.documents as unknown as UnitOption[],
        );
        setSterilitiesData(
          sterilitiesRes.documents as unknown as UnitOption[],
        );
        setUsabilitiesData(
          usabilitiesRes.documents as unknown as UnitOption[],
        );
        setStrapsData(strapsRes.documents as unknown as UnitOption[]);
        setContentsData(contentsRes.documents as unknown as UnitOption[]);
        setDosageForms(dosageFormsRes.documents as unknown as UnitOption[]);
        setContainers(containersRes.documents as unknown as UnitOption[]);
        setBrands(brandsRes.documents as unknown as UnitOption[]);

        if (allDetails.length > 0) {
          const priceResults = await Promise.all(
            allDetails.map(async (detail) => {
              try {
                const pricesRes = await databases.listDocuments(
                  DATABASE_ID,
                  SELLING_PRICES_COLLECTION_ID,
                  [
                    Query.equal("inventoryDetails", detail.$id),
                    Query.equal("status", true),
                    Query.orderDesc("$createdAt"),
                    Query.limit(1),
                  ],
                );

                if (pricesRes.total > 0) {
                  const priceDoc = pricesRes.documents[0] as any;
                  const rawPrice =
                    typeof priceDoc.price === "number"
                      ? priceDoc.price
                      : Number(priceDoc.price);
                  const price = Number.isFinite(rawPrice) ? rawPrice : null;
                  return { id: detail.$id, price };
                }
              } catch {
                // ignore per-detail price errors
              }

              return { id: detail.$id, price: null };
            }),
          );

          const priceMap: Record<string, number | null> = {};
          for (const { id, price } of priceResults) {
            priceMap[id] = price;
          }
          setPrices(priceMap);
        } else {
          setPrices({});
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load inventory details",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const fetchLocationBins = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        LOCATION_BINS_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.equal("status", true)],
      );
      const rawBins = response.documents as unknown as LocationBin[];

      if (rawBins.length === 0) {
        setLocationBins(rawBins);
        return;
      }

      const shelfIds = Array.from(
        new Set(
          rawBins
            .map((bin) => bin.locationShelves)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      let shelves: LocationShelfLink[] = [];
      let racks: LocationRackLink[] = [];
      let aisles: LocationAisleLink[] = [];

      if (shelfIds.length > 0) {
        const shelvesRes = await databases.listDocuments(
          DATABASE_ID,
          LOCATION_SHELVES_COLLECTION_ID,
          [Query.equal("$id", shelfIds), Query.equal("status", true)],
        );

        shelves = shelvesRes.documents as unknown as LocationShelfLink[];

        const rackIds = Array.from(
          new Set(
            shelves
              .map((shelf) => shelf.locationRacks)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        if (rackIds.length > 0) {
          const racksRes = await databases.listDocuments(
            DATABASE_ID,
            LOCATION_RACKS_COLLECTION_ID,
            [Query.equal("$id", rackIds), Query.equal("status", true)],
          );

          racks = racksRes.documents as unknown as LocationRackLink[];

          const aisleIds = Array.from(
            new Set(
              racks
                .map((rack) => rack.locationAisles)
                .filter((id): id is string => Boolean(id)),
            ),
          );

          if (aisleIds.length > 0) {
            const aislesRes = await databases.listDocuments(
              DATABASE_ID,
              LOCATION_AISLES_COLLECTION_ID,
              [Query.equal("$id", aisleIds), Query.equal("status", true)],
            );

            aisles = aislesRes.documents as unknown as LocationAisleLink[];
          }
        }
      }

      const shelfMap = new Map<string, LocationShelfLink>();
      const rackMap = new Map<string, LocationRackLink>();
      const aisleMap = new Map<string, LocationAisleLink>();

      for (const shelf of shelves) {
        shelfMap.set(shelf.$id, shelf);
      }
      for (const rack of racks) {
        rackMap.set(rack.$id, rack);
      }
      for (const aisle of aisles) {
        aisleMap.set(aisle.$id, aisle);
      }

      const enhancedBins = rawBins.map((bin) => {
        const shelf = bin.locationShelves
          ? shelfMap.get(bin.locationShelves)
          : undefined;
        const rack =
          shelf && shelf.locationRacks
            ? rackMap.get(shelf.locationRacks)
            : undefined;
        const aisle =
          rack && rack.locationAisles
            ? aisleMap.get(rack.locationAisles)
            : undefined;

        return {
          ...bin,
          shelfDescription: shelf?.description,
          rackDescription: rack?.description,
          aisleDescription: aisle?.description,
        };
      });

      const sortedBins = [...enhancedBins].sort((a, b) => {
        const aAisle = (a.aisleDescription ?? "").toLowerCase();
        const bAisle = (b.aisleDescription ?? "").toLowerCase();
        if (aAisle !== bAisle) return aAisle.localeCompare(bAisle);

        const aRack = (a.rackDescription ?? "").toLowerCase();
        const bRack = (b.rackDescription ?? "").toLowerCase();
        if (aRack !== bRack) return aRack.localeCompare(bRack);

        const aShelf = (a.shelfDescription ?? "").toLowerCase();
        const bShelf = (b.shelfDescription ?? "").toLowerCase();
        if (aShelf !== bShelf) return aShelf.localeCompare(bShelf);

        const aBin = (a.description ?? "").toLowerCase();
        const bBin = (b.description ?? "").toLowerCase();
        return aBin.localeCompare(bBin);
      });

      setLocationBins(sortedBins);
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : "Failed to load location bins",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const openLocationModal = (detail: InventoryDetail) => {
    setSelectedDetailForLocation(detail);
    void fetchLocationBins();
    locationModal.openModal();
  };

  const closeLocationModal = () => {
    locationModal.closeModal();
    setSelectedDetailForLocation(null);
    setLocationError(null);
    setTaggingLocationId(null);
  };

  const openDownsizeModal = (detail: InventoryDetail) => {
    setSelectedDetailForDownsize(detail);
    setNewDetailUnitId("");
    setNewDetailRunningBalance("");
    setDownsizedValue("");
    setNewMedRepIncentiveValue("");
    setNewSellingPrice("");
    setCreateDetailError(null);
    downsizeModal.openModal();
  };

  const closeDownsizeModal = () => {
    downsizeModal.closeModal();
    setSelectedDetailForDownsize(null);
    setNewDetailUnitId("");
    setNewDetailRunningBalance("");
    setDownsizedValue("");
    setNewMedRepIncentiveValue("");
    setNewSellingPrice("");
    setCreateDetailError(null);
  };

  const openBarcodeModal = (detail: InventoryDetail) => {
    setSelectedDetailForBarcode(detail);
    setBarcodeValue(detail.barcode ?? "");
    setBarcodeError(null);
    barcodeModal.openModal();
  };

  const closeBarcodeModal = () => {
    barcodeModal.closeModal();
    setSelectedDetailForBarcode(null);
    setBarcodeValue("");
    setBarcodeError(null);
  };

  const handleSaveBarcode = async () => {
    if (!selectedDetailForBarcode) {
      setBarcodeError("No inventory detail selected.");
      return;
    }

    const trimmed = barcodeValue.trim();
    if (!trimmed) {
      setBarcodeError("Barcode is required.");
      return;
    }

    try {
      setSavingBarcode(true);
      setBarcodeError(null);

      await databases.updateDocument(
        DATABASE_ID,
        INVENTORY_DETAILS_COLLECTION_ID,
        selectedDetailForBarcode.$id,
        {
          barcode: trimmed,
        },
      );

      setDetails((prev) =>
        prev.map((detail) =>
          detail.$id === selectedDetailForBarcode.$id
            ? { ...detail, barcode: trimmed }
            : detail,
        ),
      );

      setBarcodeSuccessMessage("Barcode assigned successfully.");
      closeBarcodeModal();
    } catch (err) {
      setBarcodeError(
        err instanceof Error ? err.message : "Failed to assign barcode.",
      );
    } finally {
      setSavingBarcode(false);
    }
  };

  const getProductDescriptionDetails = (
    detail: InventoryDetail | null,
  ): ProductDescription | null => {
    if (!detail?.inventories) return null;
    const inventoryRecord = inventories.find(
      (inventory) => inventory.$id === detail.inventories,
    );
    if (!inventoryRecord?.productDescriptions) return null;
    return (
      products.find(
        (item) => item.$id === inventoryRecord.productDescriptions,
      ) ?? null
    );
  };

  const getUnitDescription = (detail: InventoryDetail | null) => {
    if (!detail?.units) return "-";
    const unit = units.find((item) => item.$id === detail.units);
    return unit?.description ?? "-";
  };

  const getBrandDescription = (inventory: InventoryRecord | null) => {
    if (!inventory?.brands) return "-";
    const brand = brands.find((item) => item.$id === inventory.brands);
    return brand?.description ?? "-";
  };

  const getMedRepLabel = (detail: InventoryDetail | null) => {
    const medRep = detail?.med_rep;
    return medRep && medRep.trim() !== "" ? medRep : "-";
  };

  const getMedRepIncentiveLabel = (detail: InventoryDetail | null) => {
    const incentive = detail?.med_rep_incentive;
    if (!incentive) return "-";
    if (incentive === "percent") return "Percent";
    if (incentive === "amount") return "Amount";
    return incentive;
  };

  const getMedRepIncentiveValue = (detail: InventoryDetail | null) => {
    if (!detail) return "-";
    const rawValue =
      typeof detail.med_rep_incentive_value === "number"
        ? detail.med_rep_incentive_value
        : Number(detail.med_rep_incentive_value);
    if (!Number.isFinite(rawValue)) return "-";
    return detail.med_rep_incentive === "percent"
      ? `${rawValue}%`
      : formatPeso(rawValue);
  };

  const getMedRepIncentiveValueNumber = (detail: InventoryDetail | null) => {
    if (!detail) return null;
    const rawValue =
      typeof detail.med_rep_incentive_value === "number"
        ? detail.med_rep_incentive_value
        : Number(detail.med_rep_incentive_value);
    if (!Number.isFinite(rawValue)) return null;
    return Number(Number(rawValue).toFixed(2));
  };

  const getRunningBalance = (detail: InventoryDetail | null) => {
    if (!detail) return "-";
    const rawBalance =
      typeof detail.running_balance === "number"
        ? detail.running_balance
        : Number(detail.running_balance);
    return Number.isFinite(rawBalance) ? rawBalance : "-";
  };

  const getConversionLevel = (detail: InventoryDetail | null) => {
    if (!detail) return "-";
    const rawLevel =
      typeof detail.conversion_level === "number"
        ? detail.conversion_level
        : Number(detail.conversion_level);
    return Number.isFinite(rawLevel) ? rawLevel : "-";
  };

  const handleTagLocation = async (binId: string) => {
    if (!selectedDetailForLocation) return;

    try {
      setTaggingLocationId(binId);
      setLocationError(null);

      await databases.updateDocument(
        DATABASE_ID,
        INVENTORY_DETAILS_COLLECTION_ID,
        selectedDetailForLocation.$id,
        {
          locationBins: binId,
        },
      );

      setDetails((prev) =>
        prev.map((detail) =>
          detail.$id === selectedDetailForLocation.$id
            ? { ...detail, locationBins: binId }
            : detail,
        ),
      );

      setLocationSuccessMessage("Location tagged successfully.");
      closeLocationModal();
    } catch (err) {
      setLocationError(
        err instanceof Error
          ? err.message
          : "Failed to tag inventory detail to location",
      );
    } finally {
      setTaggingLocationId(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parts = value.split("T");
    return parts[0] || value;
  };

  const filteredDetails = details.filter((detail) => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return true;

    const inventory = inventories.find((inv) => inv.$id === detail.inventories);
    const product = inventory
      ? products.find((p) => p.$id === inventory.productDescriptions)
      : undefined;
    const unit = units.find((u) => u.$id === detail.units);

    const fields = [
      product?.name,
      inventory?.productDescriptions,
      unit?.description,
      inventory?.lot_no,
      inventory?.batch_no,
    ];

    return fields.some(
      (value) =>
        typeof value === "string" && value.toLowerCase().includes(search),
    );
  });

  const sortedDetails = [...filteredDetails].sort((a, b) => {
    const inventoryA = inventories.find((inv) => inv.$id === a.inventories);
    const inventoryB = inventories.find((inv) => inv.$id === b.inventories);

    const productA = inventoryA
      ? products.find((p) => p.$id === inventoryA.productDescriptions)
      : undefined;
    const productB = inventoryB
      ? products.find((p) => p.$id === inventoryB.productDescriptions)
      : undefined;

    const nameA = (productA?.name || inventoryA?.productDescriptions || "").toLowerCase();
    const nameB = (productB?.name || inventoryB?.productDescriptions || "").toLowerCase();

    if (!nameA && !nameB) return 0;
    if (!nameA) return 1;
    if (!nameB) return -1;

    const compareName = nameA.localeCompare(nameB);
    if (compareName !== 0) {
      return compareName;
    }

    const unitA = units.find((u) => u.$id === a.units);
    const unitB = units.find((u) => u.$id === b.units);

    const unitNameA = (unitA?.description || "").toLowerCase();
    const unitNameB = (unitB?.description || "").toLowerCase();

    if (!unitNameA && !unitNameB) return 0;
    if (!unitNameA) return 1;
    if (!unitNameB) return -1;

    return unitNameA.localeCompare(unitNameB);
  });

  const groupsMap = new Map<
    string,
    { key: string; totalBalance: number; rows: InventoryDetail[] }
  >();

  for (const detail of sortedDetails) {
    const inventory = inventories.find((inv) => inv.$id === detail.inventories);
    const productId = inventory?.productDescriptions || "";
    const unitId = detail.units || "";
    const key = `${productId}__${unitId}`;

    const running =
      typeof detail.running_balance === "number" ? detail.running_balance : 0;

    const existing = groupsMap.get(key);
    if (existing) {
      existing.totalBalance += running;
      existing.rows.push(detail);
    } else {
      groupsMap.set(key, {
        key,
        totalBalance: running,
        rows: [detail],
      });
    }
  }

  const groupedDetails = Array.from(groupsMap.values());

  const groupedRows = groupedDetails.flatMap((group) => {
    const rowSpan = group.rows.length;

    return group.rows.map((detail, index) => {
      const inventory = inventories.find((inv) => inv.$id === detail.inventories);
      const product = inventory
        ? products.find((p) => p.$id === inventory.productDescriptions)
        : undefined;
      const unit = units.find((u) => u.$id === detail.units);
      const runningBalance =
        typeof detail.running_balance === "number"
          ? detail.running_balance
          : "-";
      const priceValue = prices[detail.$id];
      const lot = inventory?.lot_no || "-";
      const batch = inventory?.batch_no || "";
      const lotBatch = batch && batch !== "-" ? `${lot} / ${batch}` : lot;
      const isFirstRow = index === 0;

      return (
        <TableRow key={detail.$id}>
          {isFirstRow && (
            <TableCell
              rowSpan={rowSpan}
              className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300"
            >
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
                inventory?.productDescriptions || "-"
              )}
            </TableCell>
          )}
          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
            {getBrandDescription(inventory || null)}
          </TableCell>
          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
            {formatDate(inventory?.date_expiry)}
          </TableCell>
          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
            {lotBatch}
          </TableCell>
          {isFirstRow && (
            <TableCell
              rowSpan={rowSpan}
              className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300"
            >
              {unit?.description ?? "-"}
            </TableCell>
          )}

          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
            {runningBalance}
          </TableCell>
          {isFirstRow && (
            <TableCell
              rowSpan={rowSpan}
              className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300"
            >
              {group.totalBalance}
            </TableCell>
          )}
          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
            {formatPeso(priceValue)}
          </TableCell>
          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
            <LocationDescriptionDetails
              binId={detail.locationBins}
              className="text-xs text-gray-700 dark:text-gray-200"
            />
          </TableCell>
          <TableCell className="px-5 py-4 text-start">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                className={
                  detail.locationBins
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }
                onClick={() => openLocationModal(detail)}
              >
                {detail.locationBins ? "Update Location" : "Add Location"}
              </Button>
              {!detail.barcode && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => openBarcodeModal(detail)}
                >
                  Assign Barcode
                </Button>
              )}
              {!detail.is_converted && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => openDownsizeModal(detail)}
                >
                  Down Sizing
                </Button>
              )}
            </div>
          </TableCell>

        </TableRow>
      );
    });
  });

  return (
    <>
      <PageMeta
        title="Inventories"
        description="View current inventory balances and selling prices"
      />
      <PageBreadcrumb pageTitle="Inventories" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="max-w-xs w-full ml-auto">
            <InputField
              type="text"
              placeholder="Search inventories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {locationSuccessMessage && (
          <Alert
            variant="success"
            title="Location updated"
            message={locationSuccessMessage}
            closable
            onClose={() => setLocationSuccessMessage(null)}
          />
        )}

        {downsizeSuccessMessage && (
          <Alert
            variant="success"
            title="Downsizing completed"
            message={downsizeSuccessMessage}
            closable
            onClose={() => setDownsizeSuccessMessage(null)}
          />
        )}

        {barcodeSuccessMessage && (
          <Alert
            variant="success"
            title="Barcode assigned"
            message={barcodeSuccessMessage}
            closable
            onClose={() => setBarcodeSuccessMessage(null)}
          />
        )}

        {error && <p className="text-sm text-error-500">{error}</p>}

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Loading inventory details...
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
                      Product
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Brands
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
                      Unit
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
                      Total Balance
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Selling Price
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Location
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {groupedRows.length > 0 ? (
                    groupedRows
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="px-5 py-8 text-center text-gray-600 dark:text-gray-300"
                      >
                        No inventory details found
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
        isOpen={locationModal.isOpen}
        onClose={closeLocationModal}
        className="max-w-3xl w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Location Bin
          </h2>
          {locationError && (
            <p className="text-sm text-error-500">
              {locationError}
            </p>
          )}
          {locationLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Loading location bins...
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Description
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
                  {locationBins.length > 0 ? (
                    locationBins.map((bin) => (
                      <TableRow key={bin.$id}>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          <div>{bin.description}</div>
                          {(bin.shelfDescription ||
                            bin.rackDescription ||
                            bin.aisleDescription) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {[
                                bin.shelfDescription,
                                bin.rackDescription,
                                bin.aisleDescription,
                              ]
                                .filter(
                                  (value): value is string => Boolean(value),
                                )
                                .join(" -> ")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <Button
                            size="sm"
                            variant="primary"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleTagLocation(bin.$id)}
                            disabled={taggingLocationId === bin.$id}
                          >
                            Tag to this location
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="px-5 py-8 text-center text-gray-600 dark:text-gray-300"
                      >
                        No location bins found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={closeLocationModal}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={downsizeModal.isOpen}
        onClose={closeDownsizeModal}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Down Sizing
          </h2>
          {selectedDetailForDownsize ? (
            <>
              <UnorderedList
                items={[
                  {
                    label: "Product Description",
                    value: (() => {
                      const record = getProductDescriptionDetails(
                        selectedDetailForDownsize,
                      );
                      if (!record) return "-";
                      return (
                        <ProductDescriptionDetails
                          record={record}
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
                          className="gap-0 text-sm"
                        />
                      );
                    })(),
                  },
                  {
                    label: "Selling Price",
                    value: (() => {
                      const price = selectedDetailForDownsize
                        ? prices[selectedDetailForDownsize.$id]
                        : null;
                      return typeof price === "number"
                        ? formatPeso(price)
                        : "-";
                    })(),
                  },
                  {
                    label: "Running Balance",
                    value: (() => {
                      const balance = getRunningBalance(selectedDetailForDownsize);
                      if (
                        typeof balance === "number" &&
                        downsizedValue &&
                        Number(downsizedValue) >= 1
                      ) {
                        return balance - 1;
                      }
                      return balance;
                    })(),
                  },
                  {
                    label: "Unit",
                    value: getUnitDescription(selectedDetailForDownsize),
                  },
                  {
                    label: "Med Rep",
                    value: getMedRepLabel(selectedDetailForDownsize),
                  },
                  {
                    label: "Med Rep Incentive",
                    value: getMedRepIncentiveLabel(selectedDetailForDownsize),
                  },
                  {
                    label: "Med Rep Incentive Value",
                    value: `${getMedRepIncentiveValue(
                      selectedDetailForDownsize,
                    )} / ${getUnitDescription(selectedDetailForDownsize)}`,
                  },
                  {
                    label: "Conversion Level",
                    value: getConversionLevel(selectedDetailForDownsize),
                  },
                ]}
              />

              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Create a downsizing 
                </h3>
                {/* <p className="text-xs text-gray-500 dark:text-gray-400">
                  Duplicate this inventory into a different unit and running balance.
                </p> */}
                <Form
                  onSubmit={handleCreateInventoryDetail}
                  className="mt-4 space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="downsized-value">
                      Downsized Value / {getUnitDescription(selectedDetailForDownsize)}
                    </Label>
                    <InputField
                      id="downsized-value"
                      type="number"
                      min="1"
                      step={1}
                      placeholder="Enter downsized value"
                      value={downsizedValue}
                      onChange={(event) => handleDownsizedValueChange(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-detail-unit">Unit</Label>
                    <SearchableSelectWithAdd
                      collectionId={UNITS_COLLECTION_ID}
                      options={units
                        .filter((unit) => unit.$id !== selectedDetailForDownsize?.units)
                        .map((unit) => ({
                          value: unit.$id,
                          label: unit.description,
                        }))}
                      placeholder="Select unit"
                      value={newDetailUnitId}
                      onChange={(value) => setNewDetailUnitId(value)}
                      onSearchChange={handleUnitSearch}
                      onAdd={(_collectionId) => handleOpenCreateUnitModal()}
                      noOptionsText="No units found"
                    />
                  </div>

                  {hasMedRepForDownsize && (
                    <div className="space-y-2">
                      <Label htmlFor="new-med-rep-incentive-value">
                        New Incentive Value (
                        {getMedRepIncentiveLabel(selectedDetailForDownsize)}
                        {(() => {
                          if (!newDetailUnitId) return "";
                          const selectedUnit = units.find(
                            (unit) => unit.$id === newDetailUnitId,
                          );
                          return selectedUnit ? ` per ${selectedUnit.description}` : "";
                        })()}
                        )
                      </Label>
                      <InputField
                        id="new-med-rep-incentive-value"
                        type="number"
                        min="0"
                        step={.01}
                        placeholder="Enter incentive value"
                        value={newMedRepIncentiveValue}
                        onChange={(event) =>
                          setNewMedRepIncentiveValue(event.target.value)
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="new-selling-price">New Selling Price</Label>
                    <InputField
                      id="new-selling-price"
                      type="number"
                      min="0"
                      step={0.01}
                      placeholder="Enter new selling price"
                      value={newSellingPrice}
                      onChange={(event) => setNewSellingPrice(event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-green-600 hover:bg-green-700"
                      type="submit"
                      disabled={creatingDetail}
                    >
                      {creatingDetail ? "Creating..." : "Create New Downsize"}
                    </Button>
                  </div>
                </Form>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No inventory detail selected.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={closeDownsizeModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={barcodeModal.isOpen}
        onClose={closeBarcodeModal}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assign Barcode
          </h2>
          {selectedDetailForBarcode ? (
            <>
              <UnorderedList
                items={[
                  {
                    label: "Product Description",
                    value: (() => {
                      const record = getProductDescriptionDetails(
                        selectedDetailForBarcode,
                      );
                      if (!record) return "-";
                      return (
                        <ProductDescriptionDetails
                          record={record}
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
                          className="gap-0 text-sm"
                        />
                      );
                    })(),
                  },
                  {
                    label: "Unit",
                    value: getUnitDescription(selectedDetailForBarcode),
                  },
                  {
                    label: "Current Barcode",
                    value: selectedDetailForBarcode.barcode || "-",
                  },
                ]}
              />
              <Form onSubmit={handleSaveBarcode} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="barcode-value">Barcode</Label>
                  <InputField
                    id="barcode-value"
                    type="text"
                    placeholder="Enter barcode"
                    value={barcodeValue}
                    onChange={(event) => setBarcodeValue(event.target.value)}
                  />
                </div>
                {barcodeError && (
                  <p className="text-sm text-error-500">{barcodeError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={closeBarcodeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    type="submit"
                    disabled={savingBarcode}
                  >
                    {savingBarcode ? "Saving..." : "Save"}
                  </Button>
                </div>
              </Form>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No inventory detail selected.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={createUnitModal.isOpen}
        onClose={createUnitModal.closeModal}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Unit
          </h2>
          <Form
            onSubmit={handleCreateUnit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="create-unit-description">Description</Label>
              <InputField
                id="create-unit-description"
                type="text"
                placeholder="Enter unit name"
                value={newUnitDescription}
                onChange={(event) => setNewUnitDescription(event.target.value)}
              />
            </div>
            {unitModalError && (
              <p className="text-sm text-error-500">{unitModalError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={createUnitModal.closeModal}
                disabled={unitModalSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                type="submit"
                disabled={unitModalSubmitting}
              >
                {unitModalSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
}

