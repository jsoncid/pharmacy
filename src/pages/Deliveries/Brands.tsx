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
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_BRANDS;

interface Brand {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  description: string;
  status: boolean;
  editable?: boolean | string;
}

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const createModal = useModal(false);
  const editModal = useModal(false);
  const deleteModal = useModal(false);

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isNotEditable =
    selectedBrand?.editable === false || selectedBrand?.editable === "false";

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.orderDesc("$createdAt"),
        Query.equal("status", true),
      ]);
      setBrands(response.documents as unknown as Brand[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch brands",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setFormError(null);
    setSubmitting(false);
  };

  const openCreateModal = () => {
    resetForm();
    createModal.openModal();
  };

  const openEditModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setDescription(brand.description ?? "");
    setFormError(null);
    editModal.openModal();
  };

  const openDeleteModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setFormError(null);
    deleteModal.openModal();
  };

  const closeAllModals = () => {
    createModal.closeModal();
    editModal.closeModal();
    deleteModal.closeModal();
    setSelectedBrand(null);
    setFormError(null);
    setSubmitting(false);
  };

  const handleCreateSubmit = async () => {
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          description: description.trim(),
          status: true,
        },
      );

      setBrands((prev) => [newDoc as unknown as Brand, ...prev]);
      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create brand",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedBrand) return;

    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedBrand.$id,
        {
          description: description.trim(),
          status: true,
        },
      );

      setBrands((prev) =>
        prev.map((brand) =>
          brand.$id === selectedBrand.$id
            ? (updatedDoc as unknown as Brand)
            : brand,
        ),
      );

      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update brand",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBrand) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedBrand.$id,
        {
          status: false,
        },
      );

      setBrands((prev) =>
        prev.filter((brand) => brand.$id !== selectedBrand.$id),
      );

      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to deactivate brand",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBrands = brands.filter((brand) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return brand.description.toLowerCase().includes(query);
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBrands.length / itemsPerPage) || 1,
  );

  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <>
      <PageMeta
        title="Brands"
        description="Manage product brands"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Brands
          </h1>
          <Button
            size="sm"
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={openCreateModal}
          >
            Add Brand
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="max-w-xs w-full">
            <InputField
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={
                (e: React.ChangeEvent<HTMLInputElement>) => 
                  setSearchQuery(e.target.value)
              }
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-error-500">
            {error}
          </p>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Loading brands...
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
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {paginatedBrands.length > 0 ? (
                    paginatedBrands.map((brand) => (
                      <TableRow key={brand.$id}>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {brand.description}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => openEditModal(brand)}
                              disabled={isNotEditable}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-gray-500 hover:bg-gray-600"
                              onClick={() => openDeleteModal(brand)}
                              disabled={isNotEditable}
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
                        colSpan={2}
                        className="px-5 py-8 text-center text-gray-600 dark:text-gray-300"
                      >
                        No brands found
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

      {/* Create Modal */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={closeAllModals}
        className="max-w-lg w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Brand
          </h2>
          <Form
            onSubmit={handleCreateSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="brand-description">Brand Name</Label>
              <InputField
                id="brand-description"
                type="text"
                value={description}
                onChange={
                  (e: React.ChangeEvent<HTMLInputElement>) => 
                    setDescription(e.target.value)
                }
                placeholder="Enter brand name"
                disabled={submitting}
              />
            </div>

            {formError && (
              <p className="text-sm text-error-500">
                {formError}
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAllModals}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Brand'}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={closeAllModals}
        className="max-w-lg w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Brand
          </h2>
          <Form
            onSubmit={handleEditSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-brand-description">Brand Name</Label>
              <InputField
                id="edit-brand-description"
                type="text"
                value={description}
                onChange={
                  (e: React.ChangeEvent<HTMLInputElement>) => 
                    setDescription(e.target.value)
                }
                placeholder="Enter brand name"
                disabled={submitting || isNotEditable}
              />
            </div>

            {formError && (
              <p className="text-sm text-error-500">
                {formError}
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAllModals}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={submitting || isNotEditable}
              >
                {submitting ? 'Updating...' : 'Update Brand'}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeAllModals}
        className="max-w-lg w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Deactivate Brand
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to deactivate this brand? This action cannot be undone.
          </p>
          
          {selectedBrand && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="font-medium">{selectedBrand.description}</p>
            </div>
          )}

          {formError && (
            <p className="text-sm text-error-500">
              {formError}
            </p>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={closeAllModals}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={submitting || isNotEditable}
            >
              {submitting ? 'Deactivating...' : 'Deactivate Brand'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
