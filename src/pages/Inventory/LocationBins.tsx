import { useEffect, useState } from "react";
import { Databases, ID, Query } from "appwrite";
import { useLocation } from "react-router";
import client from "../../lib/appwrite";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import useGoBack from "../../hooks/useGoBack";
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
const COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_bins;

interface LocationBin {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  description: string;
  status: boolean;
  locationShelves?: string;
  editable?: boolean | string;
}

export default function LocationBins() {
  const goBack = useGoBack();
  const location = useLocation();
  const locationState =
    (location.state as {
      shelfId?: string;
      shelfDescription?: string;
      rackDescription?: string;
      aisleDescription?: string;
    } | null) ?? null;
  const shelfId = locationState?.shelfId ?? "";
  const shelfDescription = locationState?.shelfDescription ?? "";
  const rackDescription = locationState?.rackDescription ?? "";
  const aisleDescription = locationState?.aisleDescription ?? "";
  const [bins, setBins] = useState<LocationBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const createModal = useModal(false);
  const editModal = useModal(false);
  const deleteModal = useModal(false);

  const [selectedBin, setSelectedBin] = useState<LocationBin | null>(null);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isNotEditable =
    selectedBin?.editable === false || selectedBin?.editable === "false";

  useEffect(() => {
    if (shelfId) {
      void fetchBins();
    }
  }, [shelfId]);

  const fetchBins = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageLimit = 100;
      let all: LocationBin[] = [];
      let offset = 0;

      for (;;) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.orderDesc("$createdAt"),
            Query.equal("status", true),
            ...(shelfId ? [Query.equal("locationShelves", shelfId)] : []),
            Query.limit(pageLimit),
            Query.offset(offset),
          ],
        );

        const docs = response.documents as unknown as LocationBin[];
        all = all.concat(docs);

        if (docs.length < pageLimit) {
          break;
        }

        offset += pageLimit;
      }

      setBins(all);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch location bins",
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

  const openEditModal = (bin: LocationBin) => {
    setSelectedBin(bin);
    setDescription(bin.description ?? "");
    setFormError(null);
    editModal.openModal();
  };

  const openDeleteModal = (bin: LocationBin) => {
    setSelectedBin(bin);
    setFormError(null);
    deleteModal.openModal();
  };

  const closeAllModals = () => {
    createModal.closeModal();
    editModal.closeModal();
    deleteModal.closeModal();
    setSelectedBin(null);
    setFormError(null);
    setSubmitting(false);
  };

  const handleCreateSubmit = async () => {
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    if (!shelfId) {
      setFormError(
        "Missing parent shelf. Please go back and select a shelf again.",
      );
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
          locationShelves: shelfId,
          status: true,
        },
      );

      setBins((prev) => [newDoc as unknown as LocationBin, ...prev]);
      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create location bin",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedBin) return;

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
        selectedBin.$id,
        {
          description: description.trim(),
          status: true,
        },
      );

      setBins((prev) =>
        prev.map((bin) =>
          bin.$id === selectedBin.$id
            ? (updatedDoc as unknown as LocationBin)
            : bin,
        ),
      );

      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to update location bin",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBin) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedBin.$id,
        {
          status: false,
        },
      );

      setBins((prev) =>
        prev.filter((bin) => bin.$id !== selectedBin.$id),
      );

      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate location bin",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBins = bins.filter((bin) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    return bin.description.toLowerCase().includes(query);
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBins.length / itemsPerPage) || 1,
  );

  const paginatedBins = filteredBins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <>
      <PageMeta
        title="Location Management - Bins"
        description="Manage inventory location bins."
      />
      <PageBreadcrumb pageTitle="Location Management" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={goBack}
            >
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Location Bins
              {aisleDescription ? ` for [${aisleDescription}] ` : ""}
              {rackDescription ? ` [${rackDescription}] ` : ""}
              {shelfDescription ? ` [${shelfDescription}] ` : ""}
              
              
            </h1>
          </div>
          <Button
            size="sm"
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={openCreateModal}
          >
            Add Bin
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="max-w-xs w-full">
            <InputField
              type="text"
              placeholder="Search location bins..."
              value={searchQuery}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>,
              ) => setSearchQuery(e.target.value)}
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
              Loading location bins...
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
                  {paginatedBins.length > 0 ? (
                    paginatedBins.map((bin) => (
                      <TableRow key={bin.$id}>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {bin.description}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => openEditModal(bin)}
                              disabled={
                                bin.editable === false ||
                                bin.editable === "false"
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-gray-500 hover:bg-gray-600"
                              onClick={() => openDeleteModal(bin)}
                              disabled={
                                bin.editable === false ||
                                bin.editable === "false"
                              }
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
                        No location bins found
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

      <Modal
        isOpen={createModal.isOpen}
        onClose={closeAllModals}
        className="max-w-lg w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Location Bin
          </h2>
          <Form
            onSubmit={() => {
              handleCreateSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="bin-description">Description</Label>
              <InputField
                id="bin-description"
                type="text"
                value={description}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setDescription(e.target.value)}
                placeholder="Short description of location bin"
              />
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
        className="max-w-lg w_full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Location Bin
          </h2>
          <Form
            onSubmit={() => {
              handleEditSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-bin-description">Description</Label>
              <InputField
                id="edit-bin-description"
                type="text"
                value={description}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setDescription(e.target.value)}
                placeholder="Short description of location bin"
              />
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
            Delete Location Bin
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to deactivate this location bin? It will be
            hidden from the list but can be restored later.
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
              disabled={isNotEditable}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
              disabled={submitting || isNotEditable}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
