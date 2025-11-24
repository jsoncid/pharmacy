import { useEffect, useState } from "react";
import { Databases, ID, Query } from "appwrite";
import client from "../../lib/appwrite";
import PageMeta from "../../components/common/PageMeta";
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
import Checkbox from "../../components/form/input/Checkbox";
import Select from "../../components/form/Select";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import ProductDescriptionDetails from "../../components/DescriptionHooks/ProductDescriptionDetails";

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCT_DESCRIPTIONS;
const CATEGORY_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CATEGORIES;
const ATC_CODE_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_ATC_CODES;
const CONTAINER_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_CONTAINERS;
const ANATOMICAL_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_ANATOMICALS;
const PHARMACOLOGICAL_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_PHARMACOLOGICALS;
const DOSAGE_FORM_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_DOSAGE_FORMS;
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
const STRAP_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_STRAPS;

interface ProductDescription {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  status: boolean;
  categories?: string;
  atcCodes?: string;
  containers?: string;
  anatomicals?: string;
  pharmacologicals?: string;
  dosageForms?: string;
  materials?: string;
  sizes?: string;
  capacityVolumes?: string;
  sterilities?: string;
  usabilities?: string;
  straps?: string;
  contents?: string;
  delivery_lock_status?: boolean;
}

interface Category {
  $id: string;
  description: string;
  status: boolean;
}

type SimpleRef = Category;

export default function ProductsLanding() {
  const [descriptions, setDescriptions] = useState<ProductDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const createModal = useModal(false);
  const editModal = useModal(false);
  const deleteModal = useModal(false);

  const [selectedDescription, setSelectedDescription] =
    useState<ProductDescription | null>(null);

  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [category, setCategory] = useState("");

  const [atcCodes, setAtcCodes] = useState<SimpleRef[]>([]);
  const [containers, setContainers] = useState<SimpleRef[]>([]);
  const [anatomicals, setAnatomicals] = useState<SimpleRef[]>([]);
  const [pharmacologicals, setPharmacologicals] = useState<SimpleRef[]>([]);
  const [dosageForms, setDosageForms] = useState<SimpleRef[]>([]);
  const [materialsData, setMaterialsData] = useState<SimpleRef[]>([]);
  const [sizesData, setSizesData] = useState<SimpleRef[]>([]);
  const [capacityVolumesData, setCapacityVolumesData] = useState<SimpleRef[]>([]);
  const [sterilitiesData, setSterilitiesData] = useState<SimpleRef[]>([]);
  const [usabilitiesData, setUsabilitiesData] = useState<SimpleRef[]>([]);
  const [strapsData, setStrapsData] = useState<SimpleRef[]>([]);
  const [contentsData, setContentsData] = useState<SimpleRef[]>([]);

  const [atcCodeId, setAtcCodeId] = useState("");
  const [containerId, setContainerId] = useState("");
  const [anatomicalId, setAnatomicalId] = useState("");
  const [pharmacologicalId, setPharmacologicalId] = useState("");
  const [dosageFormId, setDosageFormId] = useState("");
  const [materials, setMaterials] = useState("");
  const [sizes, setSizes] = useState("");
  const [capacityVolumes, setCapacityVolumes] = useState("");
  const [sterilities, setSterilities] = useState("");
  const [usabilities, setUsabilities] = useState("");
  const [straps, setStraps] = useState("");
  const [contents, setContents] = useState("");

  // N/A toggles for Drugs Technical Descriptions
  const [atcCodeNa, setAtcCodeNa] = useState(false);
  const [anatomicalNa, setAnatomicalNa] = useState(false);
  const [pharmacologicalNa, setPharmacologicalNa] = useState(false);
  const [dosageFormNa, setDosageFormNa] = useState(false);
  const [containerNa, setContainerNa] = useState(false);

  // N/A toggles for Medical Supply Technical Descriptions
  const [materialNa, setMaterialNa] = useState(false);
  const [sizeNa, setSizeNa] = useState(false);
  const [capacityVolumeNa, setCapacityVolumeNa] = useState(false);
  const [sterilityNa, setSterilityNa] = useState(false);
  const [usabilityNa, setUsabilityNa] = useState(false);
  const [strapNa, setStrapNa] = useState(false);
  const [contentNa, setContentNa] = useState(false);

  useEffect(() => {
    fetchDescriptions();
    fetchCategories();
    fetchAllLookups();
  }, []);

  const fetchDescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageLimit = 100;
      let all: ProductDescription[] = [];
      let offset = 0;

      for (;;) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.orderDesc("$createdAt"),
            Query.equal("status", true),
            Query.limit(pageLimit),
            Query.offset(offset),
          ],
        );

        const docs = response.documents as unknown as ProductDescription[];
        all = all.concat(docs);

        if (docs.length < pageLimit) {
          break;
        }

        offset += pageLimit;
      }

      setDescriptions(all);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch products",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const response = await databases.listDocuments(
        DATABASE_ID,
        CATEGORY_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.equal("status", true)],
      );
      setCategories(response.documents as unknown as Category[]);
    } catch (err) {
      setCategoriesError(
        err instanceof Error ? err.message : "Failed to fetch categories",
      );
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchAllLookups = async () => {
    try {
      const queries = [
        Query.orderDesc("$createdAt"),
        Query.equal("status", true),
      ];

      const [
        atcCodesRes,
        containersRes,
        anatomicalsRes,
        pharmacologicalsRes,
        dosageFormsRes,
        materialsRes,
        sizesRes,
        capacityVolumesRes,
        sterilitiesRes,
        usabilitiesRes,
        strapsRes,
        contentsRes,
      ] = await Promise.all([
        databases.listDocuments(DATABASE_ID, ATC_CODE_COLLECTION_ID, queries),
        databases.listDocuments(DATABASE_ID, CONTAINER_COLLECTION_ID, queries),
        databases.listDocuments(DATABASE_ID, ANATOMICAL_COLLECTION_ID, queries),
        databases.listDocuments(
          DATABASE_ID,
          PHARMACOLOGICAL_COLLECTION_ID,
          queries,
        ),
        databases.listDocuments(DATABASE_ID, DOSAGE_FORM_COLLECTION_ID, queries),
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
      ]);

      setAtcCodes(atcCodesRes.documents as unknown as SimpleRef[]);
      setContainers(containersRes.documents as unknown as SimpleRef[]);
      setAnatomicals(anatomicalsRes.documents as unknown as SimpleRef[]);
      setPharmacologicals(
        pharmacologicalsRes.documents as unknown as SimpleRef[],
      );
      setDosageForms(dosageFormsRes.documents as unknown as SimpleRef[]);
      setMaterialsData(materialsRes.documents as unknown as SimpleRef[]);
      setSizesData(sizesRes.documents as unknown as SimpleRef[]);
      setCapacityVolumesData(
        capacityVolumesRes.documents as unknown as SimpleRef[],
      );
      setSterilitiesData(sterilitiesRes.documents as unknown as SimpleRef[]);
      setUsabilitiesData(usabilitiesRes.documents as unknown as SimpleRef[]);
      setStrapsData(strapsRes.documents as unknown as SimpleRef[]);
      setContentsData(contentsRes.documents as unknown as SimpleRef[]);
    } catch {
      // ignore lookup errors; core CRUD still functions
    }
  };

  const resetForm = () => {
    setName("");
    setFormError(null);
    setSubmitting(false);
    setCategory("");
    setAtcCodeId("");
    setContainerId("");
    setAnatomicalId("");
    setPharmacologicalId("");
    setDosageFormId("");
    setMaterials("");
    setSizes("");
    setCapacityVolumes("");
    setSterilities("");
    setUsabilities("");
    setStraps("");
    setContents("");
    setAtcCodeNa(false);
    setAnatomicalNa(false);
    setPharmacologicalNa(false);
    setDosageFormNa(false);
    setContainerNa(false);
    setMaterialNa(false);
    setSizeNa(false);
    setCapacityVolumeNa(false);
    setSterilityNa(false);
    setUsabilityNa(false);
    setStrapNa(false);
    setContentNa(false);
  };

  const openCreateModal = () => {
    resetForm();
    createModal.openModal();
  };

  const openEditModal = (record: ProductDescription) => {
    setSelectedDescription(record);
    setName(record.name ?? "");
    setCategory(record.categories ?? "");
    setAtcCodeId(record.atcCodes ?? "");
    setContainerId(record.containers ?? "");
    setAnatomicalId(record.anatomicals ?? "");
    setPharmacologicalId(record.pharmacologicals ?? "");
    setDosageFormId(record.dosageForms ?? "");
    setMaterials(record.materials ?? "");
    setSizes(record.sizes ?? "");
    setCapacityVolumes(record.capacityVolumes ?? "");
    setSterilities(record.sterilities ?? "");
    setUsabilities(record.usabilities ?? "");
    setStraps(record.straps ?? "");
    setContents(record.contents ?? "");
    setAtcCodeNa(!record.atcCodes);
    setAnatomicalNa(!record.anatomicals);
    setPharmacologicalNa(!record.pharmacologicals);
    setDosageFormNa(!record.dosageForms);
    setContainerNa(!record.containers);
    setMaterialNa(!record.materials);
    setSizeNa(!record.sizes);
    setCapacityVolumeNa(!record.capacityVolumes);
    setSterilityNa(!record.sterilities);
    setUsabilityNa(!record.usabilities);
    setStrapNa(!record.straps);
    setContentNa(!record.contents);
    setFormError(null);
    editModal.openModal();
  };

  const openDeleteModal = (record: ProductDescription) => {
    setSelectedDescription(record);
    setFormError(null);
    deleteModal.openModal();
  };

  const closeAllModals = () => {
    createModal.closeModal();
    editModal.closeModal();
    deleteModal.closeModal();
    setSelectedDescription(null);
    setFormError(null);
    setSubmitting(false);
  };

  const handleCreateSubmit = async () => {
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }

    if (!category) {
      setFormError("Category is required.");
      return;
    }

    // When Drugs category is selected, drug-related fields are required
    if (category === "6921b34200391101bcf0") {
      if (!atcCodeNa && !atcCodeId) {
        setFormError("ATC Code is required unless marked N/A.");
        return;
      }
      if (!anatomicalNa && !anatomicalId) {
        setFormError("Anatomical is required unless marked N/A.");
        return;
      }
      if (!pharmacologicalNa && !pharmacologicalId) {
        setFormError("Pharmacological is required unless marked N/A.");
        return;
      }
      if (!dosageFormNa && !dosageFormId) {
        setFormError("Dosage Form is required unless marked N/A.");
        return;
      }
      if (!containerNa && !containerId) {
        setFormError("Container is required unless marked N/A.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const data: Record<string, unknown> = {
        name: name.trim(),
        status: true,
      };

      if (category) data.categories = category;
      if (atcCodeId) data.atcCodes = atcCodeId;
      if (containerId) data.containers = containerId;
      if (anatomicalId) data.anatomicals = anatomicalId;
      if (pharmacologicalId) data.pharmacologicals = pharmacologicalId;
      if (dosageFormId) data.dosageForms = dosageFormId;
      if (materials) data.materials = materials;
      if (sizes) data.sizes = sizes;
      if (capacityVolumes) data.capacityVolumes = capacityVolumes;
      if (sterilities) data.sterilities = sterilities;
      if (usabilities) data.usabilities = usabilities;
      if (straps) data.straps = straps;
      if (contents) data.contents = contents;

      const newDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        data,
      );

      setDescriptions((prev) => [
        newDoc as unknown as ProductDescription,
        ...prev,
      ]);
      await fetchDescriptions();
      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create product",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedDescription) return;

    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }

    if (!category) {
      setFormError("Category is required.");
      return;
    }

    // When Drugs category is selected, drug-related fields are required
    if (category === "6921b34200391101bcf0") {
      if (!atcCodeNa && !atcCodeId) {
        setFormError("ATC Code is required unless marked N/A.");
        return;
      }
      if (!anatomicalNa && !anatomicalId) {
        setFormError("Anatomical is required unless marked N/A.");
        return;
      }
      if (!pharmacologicalNa && !pharmacologicalId) {
        setFormError("Pharmacological is required unless marked N/A.");
        return;
      }
      if (!dosageFormNa && !dosageFormId) {
        setFormError("Dosage Form is required unless marked N/A.");
        return;
      }
      if (!containerNa && !containerId) {
        setFormError("Container is required unless marked N/A.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const data: Record<string, unknown> = {
        name: name.trim(),
        status: true,
      };

      if (category) data.categories = category;
      if (atcCodeId) data.atcCodes = atcCodeId;
      if (containerId) data.containers = containerId;
      if (anatomicalId) data.anatomicals = anatomicalId;
      if (pharmacologicalId) data.pharmacologicals = pharmacologicalId;
      if (dosageFormId) data.dosageForms = dosageFormId;
      if (materials) data.materials = materials;
      if (sizes) data.sizes = sizes;
      if (capacityVolumes) data.capacityVolumes = capacityVolumes;
      if (sterilities) data.sterilities = sterilities;
      if (usabilities) data.usabilities = usabilities;
      if (straps) data.straps = straps;
      if (contents) data.contents = contents;

      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedDescription.$id,
        data,
      );

      setDescriptions((prev) =>
        prev.map((record) =>
          record.$id === selectedDescription.$id
            ? (updatedDoc as unknown as ProductDescription)
            : record,
        ),
      );

      await fetchDescriptions();
      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update product",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDescription) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedDescription.$id,
        {
          status: false,
        },
      );

      setDescriptions((prev) =>
        prev.filter((record) => record.$id !== selectedDescription.$id),
      );

      await fetchDescriptions();
      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to deactivate product",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDescriptions = descriptions.filter((record) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    const categoryLabel = categories.find((cat) => cat.$id === record.categories)
      ?.description;

    return (
      record.name.toLowerCase().includes(query) ||
      (categoryLabel ? categoryLabel.toLowerCase().includes(query) : false)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDescriptions.length / itemsPerPage) || 1,
  );

  const paginatedDescriptions = filteredDescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <>
      <PageMeta
        title="Products"
        description="Explore our pharmacy products and technical descriptions"
      />
      <div className="space-y-10">


        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Products
            </h2>
            <Button
              size="sm"
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
              onClick={openCreateModal}
            >
              Add Product
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="max-w-xs w-full">
              <InputField
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {categoriesError && (
            <p className="text-xs text-error-500 mt-1">
              {categoriesError}
            </p>
          )}

          {error && (
            <p className="text-sm text-error-500">
              {error}
            </p>
          )}

          {loading ? (
            <div className="py-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Loading products...
              </p>
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
                        Description
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Category
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
                    {paginatedDescriptions.length > 0 ? (
                      paginatedDescriptions.map((record) => (
                        <TableRow key={record.$id}>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
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
                            />
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {categories.find((cat) => cat.$id === record.categories)
                              ?.description ?? "Unknown"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => openEditModal(record)}
                                disabled={record.delivery_lock_status === true}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                className="bg-gray-500 hover:bg-gray-600"
                                onClick={() => openDeleteModal(record)}
                                disabled={record.delivery_lock_status === true}
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
                          colSpan={3}
                          className="px-5 py-8 text-center text-gray-600 dark:text-gray-300"
                        >
                          No products found
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
                      setCurrentPage((prev) =>
                        Math.min(totalPages, prev + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={createModal.isOpen}
        onClose={closeAllModals}
        className="max-w-7xl w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Product
          </h2>
          <Form
            onSubmit={() => {
              handleCreateSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Category</Label>
              {categoriesLoading ? (
                <p className="text-xs text-gray-500">Loading categories...</p>
              ) : (
                <Select
                  options={categories.map((cat) => ({
                    value: cat.$id,
                    label: cat.description,
                  }))}
                  placeholder="Select category"
                  defaultValue={category}
                  onChange={(value) => setCategory(value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <InputField
                id="product-name"
                type="text"
                value={name}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setName(e.target.value)}
                placeholder="Short product details"
              />
            </div>

            <div className="space-y-4">
              {category === "6921b34200391101bcf0" && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Drugs Technical Descriptions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ATC Code</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={atcCodes.map((code) => ({
                              value: code.$id,
                              label: code.description,
                            }))}
                            placeholder="Select ATC code"
                            defaultValue={atcCodeId}
                            onChange={(value) => setAtcCodeId(value)}
                            disabled={atcCodeNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={atcCodeNa}
                          onChange={(checked) => {
                            setAtcCodeNa(checked);
                            if (checked) setAtcCodeId("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Anatomical</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={anatomicals.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select anatomical"
                            defaultValue={anatomicalId}
                            onChange={(value) => setAnatomicalId(value)}
                            disabled={anatomicalNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={anatomicalNa}
                          onChange={(checked) => {
                            setAnatomicalNa(checked);
                            if (checked) setAnatomicalId("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Pharmacological</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={pharmacologicals.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select pharmacological"
                            defaultValue={pharmacologicalId}
                            onChange={(value) => setPharmacologicalId(value)}
                            disabled={pharmacologicalNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={pharmacologicalNa}
                          onChange={(checked) => {
                            setPharmacologicalNa(checked);
                            if (checked) setPharmacologicalId("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Dosage Form</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={dosageForms.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select dosage form"
                            defaultValue={dosageFormId}
                            onChange={(value) => setDosageFormId(value)}
                            disabled={dosageFormNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={dosageFormNa}
                          onChange={(checked) => {
                            setDosageFormNa(checked);
                            if (checked) setDosageFormId("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Container</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={containers.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select container"
                            defaultValue={containerId}
                            onChange={(value) => setContainerId(value)}
                            disabled={containerNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={containerNa}
                          onChange={(checked) => {
                            setContainerNa(checked);
                            if (checked) setContainerId("");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {category === "6921b35d00254b63f35e" && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Medical Supply Technical Descriptions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Material</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={materialsData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select material"
                            defaultValue={materials}
                            onChange={(value) => setMaterials(value)}
                            disabled={materialNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={materialNa}
                          onChange={(checked) => {
                            setMaterialNa(checked);
                            if (checked) setMaterials("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={sizesData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select size"
                            defaultValue={sizes}
                            onChange={(value) => setSizes(value)}
                            disabled={sizeNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={sizeNa}
                          onChange={(checked) => {
                            setSizeNa(checked);
                            if (checked) setSizes("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Capacity &amp; Volume</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={capacityVolumesData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select capacity &amp; volume"
                            defaultValue={capacityVolumes}
                            onChange={(value) => setCapacityVolumes(value)}
                            disabled={capacityVolumeNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={capacityVolumeNa}
                          onChange={(checked) => {
                            setCapacityVolumeNa(checked);
                            if (checked) setCapacityVolumes("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Sterility</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={sterilitiesData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select sterility"
                            defaultValue={sterilities}
                            onChange={(value) => setSterilities(value)}
                            disabled={sterilityNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={sterilityNa}
                          onChange={(checked) => {
                            setSterilityNa(checked);
                            if (checked) setSterilities("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Usability</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={usabilitiesData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select usability"
                            defaultValue={usabilities}
                            onChange={(value) => setUsabilities(value)}
                            disabled={usabilityNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={usabilityNa}
                          onChange={(checked) => {
                            setUsabilityNa(checked);
                            if (checked) setUsabilities("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Strap</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={strapsData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select strap"
                            defaultValue={straps}
                            onChange={(value) => setStraps(value)}
                            disabled={strapNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={strapNa}
                          onChange={(checked) => {
                            setStrapNa(checked);
                            if (checked) setStraps("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            options={contentsData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select content"
                            defaultValue={contents}
                            onChange={(value) => setContents(value)}
                            disabled={contentNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={contentNa}
                          onChange={(checked) => {
                            setContentNa(checked);
                            if (checked) setContents("");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <p className="text-sm text-error-500">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={closeAllModals}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                type="submit"
                disabled={submitting}
              >
                Save
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <Modal
        isOpen={editModal.isOpen}
        onClose={closeAllModals}
        className="max-w-7xl w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Product
          </h2>
          <Form
            onSubmit={() => {
              handleEditSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-product-name">Name</Label>
              <InputField
                id="edit-product-name"
                type="text"
                value={name}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setName(e.target.value)}
                placeholder="Short product details"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              {categoriesLoading ? (
                <p className="text-xs text-gray-500">Loading categories...</p>
              ) : (
                <Select
                  key={selectedDescription?.$id ?? "edit-category"}
                  options={categories.map((cat) => ({
                    value: cat.$id,
                    label: cat.description,
                  }))}
                  placeholder="Select category"
                  defaultValue={category}
                  onChange={(value) => setCategory(value)}
                />
              )}
            </div>

            <div className="space-y-4">
              {category === "6921b34200391101bcf0" && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Drugs TechnicalDescriptions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ATC Code</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-atc-code"}
                            options={atcCodes.map((code) => ({
                              value: code.$id,
                              label: code.description,
                            }))}
                            placeholder="Select ATC code"
                            defaultValue={atcCodeId}
                            onChange={(value) => setAtcCodeId(value)}
                            disabled={atcCodeNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={atcCodeNa}
                          onChange={(checked) => {
                            setAtcCodeNa(checked);
                            if (checked) setAtcCodeId("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Anatomical</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-anatomical"}
                            options={anatomicals.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select anatomical"
                            defaultValue={anatomicalId}
                            onChange={(value) => setAnatomicalId(value)}
                            disabled={anatomicalNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={anatomicalNa}
                          onChange={(checked) => {
                            setAnatomicalNa(checked);
                            if (checked) setAnatomicalId("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Pharmacological</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-pharmacological"}
                            options={pharmacologicals.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select pharmacological"
                            defaultValue={pharmacologicalId}
                            onChange={(value) => setPharmacologicalId(value)}
                            disabled={pharmacologicalNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={pharmacologicalNa}
                          onChange={(checked) => {
                            setPharmacologicalNa(checked);
                            if (checked) setPharmacologicalId("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Dosage Form</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-dosage-form"}
                            options={dosageForms.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select dosage form"
                            defaultValue={dosageFormId}
                            onChange={(value) => setDosageFormId(value)}
                            disabled={dosageFormNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={dosageFormNa}
                          onChange={(checked) => {
                            setDosageFormNa(checked);
                            if (checked) setDosageFormId("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Container</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-container"}
                            options={containers.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select container"
                            defaultValue={containerId}
                            onChange={(value) => setContainerId(value)}
                            disabled={containerNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={containerNa}
                          onChange={(checked) => {
                            setContainerNa(checked);
                            if (checked) setContainerId("");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {category === "6921b35d00254b63f35e" && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Medical Supply Technical Descriptions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Material</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-material"}
                            options={materialsData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select material"
                            defaultValue={materials}
                            onChange={(value) => setMaterials(value)}
                            disabled={materialNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={materialNa}
                          onChange={(checked) => {
                            setMaterialNa(checked);
                            if (checked) setMaterials("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-size"}
                            options={sizesData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select size"
                            defaultValue={sizes}
                            onChange={(value) => setSizes(value)}
                            disabled={sizeNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={sizeNa}
                          onChange={(checked) => {
                            setSizeNa(checked);
                            if (checked) setSizes("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Capacity &amp; Volume</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-capacity-volume"}
                            options={capacityVolumesData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select capacity &amp; volume"
                            defaultValue={capacityVolumes}
                            onChange={(value) => setCapacityVolumes(value)}
                            disabled={capacityVolumeNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={capacityVolumeNa}
                          onChange={(checked) => {
                            setCapacityVolumeNa(checked);
                            if (checked) setCapacityVolumes("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Sterility</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-sterility"}
                            options={sterilitiesData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select sterility"
                            defaultValue={sterilities}
                            onChange={(value) => setSterilities(value)}
                            disabled={sterilityNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={sterilityNa}
                          onChange={(checked) => {
                            setSterilityNa(checked);
                            if (checked) setSterilities("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Usability</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-usability"}
                            options={usabilitiesData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select usability"
                            defaultValue={usabilities}
                            onChange={(value) => setUsabilities(value)}
                            disabled={usabilityNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={usabilityNa}
                          onChange={(checked) => {
                            setUsabilityNa(checked);
                            if (checked) setUsabilities("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Strap</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-strap"}
                            options={strapsData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select strap"
                            defaultValue={straps}
                            onChange={(value) => setStraps(value)}
                            disabled={strapNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={strapNa}
                          onChange={(checked) => {
                            setStrapNa(checked);
                            if (checked) setStraps("");
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            key={selectedDescription?.$id ?? "edit-content"}
                            options={contentsData.map((item) => ({
                              value: item.$id,
                              label: item.description,
                            }))}
                            placeholder="Select content"
                            defaultValue={contents}
                            onChange={(value) => setContents(value)}
                            disabled={contentNa}
                          />
                        </div>
                        <Checkbox
                          label="N/A"
                          checked={contentNa}
                          onChange={(checked) => {
                            setContentNa(checked);
                            if (checked) setContents("");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <p className="text-sm text-error-500">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={closeAllModals}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700"
                type="submit"
                disabled={submitting}
              >
                Update
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeAllModals}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Product
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to deactivate this product? It will be hidden
            from the list but can be restored later.
          </p>
          {formError && (
            <p className="text-sm text-error-500">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={closeAllModals}
            >
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
