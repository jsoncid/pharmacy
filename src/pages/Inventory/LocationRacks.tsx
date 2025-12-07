import { useEffect, useState } from "react";
import { Databases, ID, Query } from "appwrite";
import { useNavigate, useLocation } from "react-router";
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
  import.meta.env.VITE_APPWRITE_COLLECTION_location_racks;

interface LocationRack {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  description: string;
  status: boolean;
  locationAisles?: string;
  editable?: boolean | string;
}

export default function LocationRacks() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState =
    (location.state as { aisleId?: string; aisleDescription?: string } | null) ??
    null;
  const aisleId = locationState?.aisleId ?? "";
  const aisleDescription = locationState?.aisleDescription ?? "";
  const goBack = useGoBack();
  const [racks, setRacks] = useState<LocationRack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const createModal = useModal(false);
  const editModal = useModal(false);
  const deleteModal = useModal(false);

  const [selectedRack, setSelectedRack] = useState<LocationRack | null>(null);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isNotEditable =
    selectedRack?.editable === false || selectedRack?.editable === "false";

  useEffect(() => {
    if (aisleId) {
      void fetchRacks();
    }
  }, [aisleId]);

  const fetchRacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageLimit = 100;
      let all: LocationRack[] = [];
      let offset = 0;

      for (;;) {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.orderDesc("$createdAt"),
            Query.equal("status", true),
            ...(aisleId ? [Query.equal("locationAisles", aisleId)] : []),
            Query.limit(pageLimit),
            Query.offset(offset),
          ],
        );

        const docs = response.documents as unknown as LocationRack[];
        all = all.concat(docs);

        if (docs.length < pageLimit) {
          break;
        }

        offset += pageLimit;
      }

      setRacks(all);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch location racks",
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

  const openEditModal = (rack: LocationRack) => {
    setSelectedRack(rack);
    setDescription(rack.description ?? "");
    setFormError(null);
    editModal.openModal();
  };

  const openDeleteModal = (rack: LocationRack) => {
    setSelectedRack(rack);
    setFormError(null);
    deleteModal.openModal();
  };

  const closeAllModals = () => {
    createModal.closeModal();
    editModal.closeModal();
    deleteModal.closeModal();
    setSelectedRack(null);
    setFormError(null);
    setSubmitting(false);
  };

  const handleCreateSubmit = async () => {
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    if (!aisleId) {
      setFormError("Missing parent aisle. Please go back and select an aisle again.");
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
          locationAisles: aisleId,
          status: true,
        },
      );

      setRacks((prev) => [newDoc as unknown as LocationRack, ...prev]);
      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create location rack",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedRack) return;

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
        selectedRack.$id,
        {
          description: description.trim(),
          status: true,
        },
      );

      setRacks((prev) =>
        prev.map((rack) =>
          rack.$id === selectedRack.$id
            ? (updatedDoc as unknown as LocationRack)
            : rack,
        ),
      );

      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to update location rack",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRack) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedRack.$id,
        {
          status: false,
        },
      );

      setRacks((prev) =>
        prev.filter((rack) => rack.$id !== selectedRack.$id),
      );

      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate location rack",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRacks = racks.filter((rack) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    return rack.description.toLowerCase().includes(query);
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRacks.length / itemsPerPage) || 1,
  );

  const paginatedRacks = filteredRacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <>
      <PageMeta
        title="Location Management - Racks"
        description="Manage inventory location racks."
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
              Location Racks
              {aisleDescription ? ` for [${aisleDescription}] ` : ""}
            </h1>
          </div>
          <Button
            size="sm"
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={openCreateModal}
          >
            Add Rack
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="max-w-xs w-full">
            <InputField
              type="text"
              placeholder="Search location racks..."
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
              Loading location racks...
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
                  {paginatedRacks.length > 0 ? (
                    paginatedRacks.map((rack) => (
                      <TableRow key={rack.$id}>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {rack.description}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                navigate("/inventories/location-shelves", {
                                  state: {
                                    rackId: rack.$id,
                                    rackDescription: rack.description,
                                    aisleId,
                                    aisleDescription,
                                  },
                                })
                              }
                              disabled={
                                rack.editable === false ||
                                rack.editable === "false"
                              }
                            >
                              Next Level
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => openEditModal(rack)}
                              disabled={
                                rack.editable === false ||
                                rack.editable === "false"
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-gray-500 hover:bg-gray-600"
                              onClick={() => openDeleteModal(rack)}
                              disabled={
                                rack.editable === false ||
                                rack.editable === "false"
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
                        No location racks found
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
            Create Location Rack
          </h2>
          <Form
            onSubmit={() => {
              handleCreateSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="rack-description">Description</Label>
              <InputField
                id="rack-description"
                type="text"
                value={description}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setDescription(e.target.value)}
                placeholder="Short description of location rack"
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
        className="max-w-lg w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Location Rack
          </h2>
          <Form
            onSubmit={() => {
              handleEditSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-rack-description">Description</Label>
              <InputField
                id="edit-rack-description"
                type="text"
                value={description}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setDescription(e.target.value)}
                placeholder="Short description of location rack"
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
            Delete Location Rack
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to deactivate this location rack? It will be
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
