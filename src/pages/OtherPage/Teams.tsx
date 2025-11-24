import { useEffect, useState } from "react";
import { Teams, ID } from "appwrite";
import client from "../../lib/appwrite";
import { useAuth } from "../../context/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import InputField from "../../components/form/input/InputField";
import Form from "../../components/form/Form";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";

const teams = new Teams(client);

interface Team {
  $id: string;
  name: string;
  $createdAt: string;
  total: number;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamId, setNewTeamId] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const createModal = useModal(false);
  const editModal = useModal(false);

  useEffect(() => {
    if (newTeamName.trim()) {
      // Convert team name to slug format for team ID
      const slug = newTeamName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      setNewTeamId(slug);
    } else {
      setNewTeamId("");
    }
  }, [newTeamName]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await teams.list();
      setTeamsList(response.teams as Team[]);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim() || !user) return;
    try {
      const teamId = newTeamId.trim() || ID.unique();
      await teams.create(teamId, newTeamName);

      setNewTeamName("");
      setNewTeamId("");
      fetchTeams();
      createModal.closeModal();
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const updateTeam = async () => {
    if (!editingTeam || !editName.trim()) return;
    try {
      await teams.updateName(editingTeam.$id, editName);
      setEditingTeam(null);
      setEditName("");
      fetchTeams();
      editModal.closeModal();
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    editModal.openModal();
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setEditName("");
    editModal.closeModal();
  };

  const openCreateModal = () => {
    setNewTeamName("");
    setNewTeamId("");
    createModal.openModal();
  };

  // Filter teams based on search query
  const getFilteredTeams = () => {
    if (!searchQuery.trim()) {
      return teamsList;
    }

    const query = searchQuery.toLowerCase();
    return teamsList.filter(team => {
      // Search in team name
      const teamName = team.name?.toLowerCase() || '';
      return teamName.includes(query);
    });
  };

  // Get paginated teams
  const getPaginatedTeams = () => {
    const filtered = getFilteredTeams();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredTeams().length / itemsPerPage);

  return (
    <>
      <PageMeta
        title="Teams Management | VoteSense"
        description="Manage teams in VoteSense"
      />
      <PageBreadcrumb pageTitle="Team Management" />
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-white/[0.03] lg:p-5">
        {/* <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Team Management
        </h3> */}

        {/* Create Team */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-md dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-3 text-base font-medium dark:text-white">Create New Team</h4>
          <Button
            size="sm"
            variant="primary"
            className="bg-green-600 hover:bg-green-700 px-5 py-3.5"
            onClick={openCreateModal}
          >
            Create Team
          </Button>
        </div>

        {/* Teams List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-800 dark:text-white">Teams</h4>
            <div className="flex items-center gap-2">
              <InputField
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <p className="dark:text-white">Loading...</p>
          ) : getFilteredTeams().length === 0 ? (
            <p className="text-gray-500 dark:text-white">
              {teamsList.length === 0 ? 'No teams found.' : 'No teams match your search.'}
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    {/* Table Header */}
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Team Name
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Team ID
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Members
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Created At
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {getPaginatedTeams().map((team) => (
                        <TableRow key={team.$id}>
                          <TableCell className="px-5 py-4 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {team.name}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {team.$id}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {team.total}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {new Date(team.$createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => startEdit(team)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, getFilteredTeams().length)} of {getFilteredTeams().length} teams
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Team
          </h4>
          <Form
            onSubmit={() => {
              void createTeam();
            }}
            className="space-y-4"
          >
            <InputField
              type="text"
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={createModal.closeModal}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                type="submit"
              >
                Create
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={cancelEdit}
        className="max-w-md w-full p-6"
      >
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Team
          </h4>
          <Form
            onSubmit={() => {
              void updateTeam();
            }}
            className="space-y-4"
          >
            <InputField
              type="text"
              placeholder="Team name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                type="submit"
              >
                Save
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
}
