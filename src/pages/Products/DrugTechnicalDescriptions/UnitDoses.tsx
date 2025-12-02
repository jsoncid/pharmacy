import { useEffect, useState } from "react";
import { Databases, ID, Query } from "appwrite";
import client from "../../../lib/appwrite";
import PageMeta from "../../../components/common/PageMeta";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../components/ui/table";
import Button from "../../../components/ui/button/Button";
import InputField from "../../../components/form/input/InputField";
import Form from "../../../components/form/Form";
import Label from "../../../components/form/Label";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_UNIT_DOSES;

interface UnitDose {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  description: string;
  status: boolean;
  editable?: boolean | string;
}

export default function UnitDoses() {
  const [unitDoses, setUnitDoses] = useState<UnitDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const createModal = useModal(false);
  const editModal = useModal(false);
  const deleteModal = useModal(false);

  const [selectedUnitDose, setSelectedUnitDose] = useState<UnitDose | null>(null);

  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isNotEditable =
    selectedUnitDose?.editable === false ||
    selectedUnitDose?.editable === "false";

  useEffect(() => {
    fetchUnitDoses();
  }, []);

  const fetchUnitDoses = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageLimit = 100;
      let all: UnitDose[] = [];
      let offset = 0;

      for (;;) {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
          Query.orderDesc("$createdAt"),
          Query.equal("status", true),
          Query.limit(pageLimit),
          Query.offset(offset),
        ]);

        const docs = response.documents as unknown as UnitDose[];
        all = all.concat(docs);

        if (docs.length < pageLimit) {
          break;
        }

        offset += pageLimit;
      }

      setUnitDoses(all);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch unit doses",
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

  const openEditModal = (dose: UnitDose) => {
    setSelectedUnitDose(dose);
    setDescription(dose.description ?? "");
    setFormError(null);
    editModal.openModal();
  };

  const openDeleteModal = (dose: UnitDose) => {
    setSelectedUnitDose(dose);
    setFormError(null);
    deleteModal.openModal();
  };

  const closeAllModals = () => {
    createModal.closeModal();
    editModal.closeModal();
    deleteModal.closeModal();
    setSelectedUnitDose(null);
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

      setUnitDoses((prev) => [newDoc as unknown as UnitDose, ...prev]);
      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create unit dose",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedUnitDose) return;

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
        selectedUnitDose.$id,
        {
          description: description.trim(),
          status: true,
        },
      );

      setUnitDoses((prev) =>
        prev.map((dose) =>
          dose.$id === selectedUnitDose.$id
            ? (updatedDoc as unknown as UnitDose)
            : dose,
        ),
      );

      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update unit dose",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUnitDose) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, selectedUnitDose.$id, {
        status: false,
      });

      setUnitDoses((prev) => prev.filter((dose) => dose.$id !== selectedUnitDose.$id));

      closeAllModals();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to deactivate unit dose",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoses = unitDoses.filter((dose) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    return dose.description.toLowerCase().includes(query);
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDoses.length / itemsPerPage) || 1,
  );

  const paginatedDoses = filteredDoses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <>
      <PageMeta
        title="Unit Doses"
        description="Manage unit doses"
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Unit Doses
          </h1>
          <Button
            size="sm"
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={openCreateModal}
          >
            Add Unit Dose
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <InputField
            type="text"
            placeholder="Search unit doses..."
            value={searchQuery}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement>,
            ) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {error && (
          <p className="text-sm text-error-500">
            {error}
          </p>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Loading unit doses...
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
                  {paginatedDoses.length > 0 ? (
                    paginatedDoses.map((dose) => (
                      <TableRow key={dose.$id}>
                        <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                          {dose.description}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => openEditModal(dose)}
                              disabled={
                                dose.editable === false || dose.editable === "false"
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-gray-500 hover:bg-gray-600"
                              onClick={() => openDeleteModal(dose)}
                              disabled={
                                dose.editable === false || dose.editable === "false"
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
                        No unit doses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
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
            Create Unit Dose
          </h2>
          <Form
            onSubmit={() => {
              handleCreateSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="unit-dose-description">Description</Label>
              <InputField
                id="unit-dose-description"
                type="text"
                value={description}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setDescription(e.target.value)}
                placeholder="Short description of unit dose"
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

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={closeAllModals}
        className="max-w-lg w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Unit Dose
          </h2>
          <Form
            onSubmit={() => {
              handleEditSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-unit-dose-description">Description</Label>
              <InputField
                id="edit-unit-dose-description"
                type="text"
                value={description}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement>,
                ) => setDescription(e.target.value)}
                placeholder="Short description of unit dose"
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

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeAllModals}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Unit Dose
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to deactivate this unit dose? It will be
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
