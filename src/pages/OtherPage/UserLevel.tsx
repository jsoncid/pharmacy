import { useState, useEffect } from 'react';
import { Databases, ID, Query, Teams } from 'appwrite';
import client from '../../lib/appwrite';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import InputField from "../../components/form/input/InputField";
import Form from "../../components/form/Form";
import Checkbox from "../../components/form/input/Checkbox";

const databases = new Databases(client);
const teams = new Teams(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_USER_LEVEL_TO_TEAMS;

interface UserLevelAssignment {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  level_description: string;
  status: boolean;
  teams_and_roles: string[]; // Array of JSON strings: 'teamId:create,read,update,delete'
}

interface Team {
  $id: string;
  name: string;
  total: number;
}

export default function UserLevelPage() {
  const [assignments, setAssignments] = useState<UserLevelAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [levelDescription, setLevelDescription] = useState('');
  const [teamPermissions, setTeamPermissions] = useState<Array<{ teamId: string; permissions: string[] }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAssignments();
    fetchTeams();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.orderDesc('$createdAt'),
        Query.equal('status', true)
      ]);
      setAssignments(response.documents as unknown as UserLevelAssignment[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      const response = await teams.list();
      setAvailableTeams(response.teams as unknown as Team[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setTeamsLoading(false);
    }
  };

  // Filter assignments based on search query
  const getFilteredAssignments = () => {
    if (!searchQuery.trim()) {
      return assignments;
    }

    const query = searchQuery.toLowerCase();
    return assignments.filter(assignment => {
      // Search in level description
      const levelDesc = assignment.level_description?.toLowerCase() || '';

      // Search in team names associated with this assignment
      const teamNames = assignment.teams_and_roles
        .map(encodedTeam => {
          if (typeof encodedTeam === 'string') {
            const teamId = encodedTeam.includes(':') ? encodedTeam.split(':')[0] : encodedTeam;
            const team = availableTeams.find(t => t.$id === teamId);
            return team?.name?.toLowerCase() || '';
          }
          return '';
        })
        .filter(name => name.length > 0);

      // Check if query matches level description or any team name
      return levelDesc.includes(query) || teamNames.some(name => name.includes(query));
    });
  };

  const createAssignment = async (levelDescription: string, teamPermissions: Array<{ teamId: string; permissions: string[] }>) => {
    try {
      setError(null);
      // Convert team permissions to encoded strings
      const encodedTeamsAndRoles = teamPermissions.map(tp => 
        `${tp.teamId}:${tp.permissions.join(',')}`
      );

      const newAssignment = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          level_description: levelDescription,
          teams_and_roles: encodedTeamsAndRoles,
          status: true,
        }
      );
      setAssignments(prev => [newAssignment as unknown as UserLevelAssignment, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
      throw err;
    }
  };

  const updateAssignment = async (id: string, levelDescription: string, teamPermissions: Array<{ teamId: string; permissions: string[] }>) => {
    try {
      setError(null);
      // Convert team permissions to encoded strings
      const encodedTeamsAndRoles = teamPermissions.map(tp => 
        `${tp.teamId}:${tp.permissions.join(',')}`
      );

      const updatedAssignment = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id,
        {
          level_description: levelDescription,
          teams_and_roles: encodedTeamsAndRoles,
        }
      );
      setAssignments(prev =>
        prev.map(assignment =>
          assignment.$id === id ? updatedAssignment as unknown as UserLevelAssignment : assignment
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
      throw err;
    }
  };

  const resetForm = () => {
    setLevelDescription('');
    setTeamPermissions([]);
    setIsEditing(false);
    setEditingId(null);
  };

  const startEditing = (assignment: UserLevelAssignment) => {
    setLevelDescription(assignment.level_description);

    // Handle backward compatibility for teams_and_roles format
    const teamsData = assignment.teams_and_roles;
    let teamPermissions: Array<{ teamId: string; permissions: string[] }> = [];

    if (Array.isArray(teamsData)) {
      teamPermissions = teamsData.map(encodedTeam => {
        if (typeof encodedTeam === 'string') {
          // Check if it's encoded with permissions (contains ':')
          if (encodedTeam.includes(':')) {
            const [teamId, permissionsStr] = encodedTeam.split(':');
            const permissions = permissionsStr ? permissionsStr.split(',') : [];
            return { teamId, permissions };
          } else {
            // Old format: just team ID, give default permissions
            return { 
              teamId: encodedTeam, 
              permissions: ['create', 'read', 'update', 'delete'] 
            };
          }
        }
        // Fallback for unexpected format
        return { teamId: 'unknown', permissions: [] };
      });
    }

    setTeamPermissions(teamPermissions);
    setIsEditing(true);
    setEditingId(assignment.$id);
  };

  const handleTeamToggle = (teamId: string, checked: boolean) => {
    setTeamPermissions(prev => {
      if (checked) {
        return [...prev, { teamId, permissions: [] }]; // Add team with empty permissions
      } else {
        return prev.filter(tp => tp.teamId !== teamId); // Remove team
      }
    });
  };

  const handlePermissionToggle = (teamId: string, permission: string, checked: boolean) => {
    setTeamPermissions(prev =>
      prev.map(tp =>
        tp.teamId === teamId
          ? {
              ...tp,
              permissions: checked
                ? [...tp.permissions, permission]
                : tp.permissions.filter(p => p !== permission)
            }
          : tp
      )
    );
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && editingId) {
        await updateAssignment(editingId, levelDescription, teamPermissions);
      } else {
        await createAssignment(levelDescription, teamPermissions);
      }
      resetForm();
    } catch (err) {
      // Error is already set in the functions
    }
  };

  return (
    <>
      <PageMeta
        title="User Level | VoteSense"
        description="Manage user levels and permissions in VoteSense"
      />
      <PageBreadcrumb pageTitle="User Level Management" />
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-white/[0.03] lg:p-5">
        {/* <h3 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          User Level Management
        </h3> */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-md dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-4 font-medium text-gray-800 dark:text-white">
            {isEditing ? 'Edit Assignment' : 'Create New User Level Assignment'}
          </h4>
          <Form
            onSubmit={() => {
              void handleSubmit();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Level Description
              </label>
              <InputField
                type="text"
                value={levelDescription}
                onChange={(e) => setLevelDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teams and Permissions
              </label>
              {teamsLoading ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">Loading teams...</p>
              ) : availableTeams.length === 0 ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">No teams available</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 dark:border-gray-600">
                  {availableTeams.map((team) => {
                    const teamPermission = teamPermissions.find(tp => tp.teamId === team.$id);
                    const isSelected = !!teamPermission;
                    const permissions = teamPermission?.permissions || [];
                    const crudPermissions = ['create', 'read', 'update', 'delete'];

                    return (
                      <div key={team.$id} className="border-b border-gray-200 pb-3 last:border-b-0 dark:border-gray-700">
                        <Checkbox
                          label={`${team.name} (${team.total} member/s)`}
                          checked={isSelected}
                          onChange={(checked) => handleTeamToggle(team.$id, checked)}
                        />

                        {isSelected && (
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            {crudPermissions.map((permission) => (
                              <Checkbox
                                key={permission}
                                label={permission}
                                checked={permissions.includes(permission)}
                                onChange={(checked) =>
                                  handlePermissionToggle(team.$id, permission, checked)
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {teamPermissions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Selected teams: {teamPermissions.length}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                type="submit"
              >
                {isEditing ? 'Update' : 'Create'}
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        </div>

        {/* Assignments List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-800 dark:text-white">Existing User Levels</h4>
            <div className="flex items-center gap-2">
              <InputField
                type="text"
                placeholder="Search levels and teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading assignments...</p>
          ) : getFilteredAssignments().length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              {assignments.length === 0 ? 'No assignments found.' : 'No assignments match your search.'}
            </p>
          ) : (
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
                        Level Description
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Teams Assigned
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
                    {getFilteredAssignments().map((assignment) => (
                      <TableRow key={assignment.$id}>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {assignment.level_description}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div className="flex flex-col gap-1">
                            {assignment.teams_and_roles.length === 0 ? (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                No teams
                              </span>
                            ) : (
                              assignment.teams_and_roles.map((encodedTeam) => {
                                if (typeof encodedTeam === 'string') {
                                  let teamId = encodedTeam;
                                  let permissions: string[] = [];

                                  if (encodedTeam.includes(':')) {
                                    const [id, permissionsStr] = encodedTeam.split(':');
                                    teamId = id;
                                    permissions = permissionsStr ? permissionsStr.split(',') : [];
                                  } else {
                                    // Backward compatibility: old format without permissions
                                    permissions = ['create', 'read', 'update', 'delete'];
                                  }

                                  const team = availableTeams.find((t) => t.$id === teamId);
                                  const teamName = team?.name || teamId;

                                  return (
                                    <div
                                      key={encodedTeam}
                                      className="flex flex-wrap items-center gap-1 text-xs"
                                    >
                                      <span className="font-medium text-gray-700 dark:text-gray-200">
                                        {teamName}
                                      </span>
                                      {permissions.length > 0 && (
                                        <>
                                          <span className="text-gray-400 dark:text-gray-500">-</span>
                                          {permissions.map((permission) => (
                                            <span
                                              key={`${encodedTeam}-${permission}`}
                                              className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] dark:bg-blue-900 dark:text-blue-200 capitalize"
                                            >
                                              {permission}
                                            </span>
                                          ))}
                                        </>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(assignment.$createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => startEditing(assignment)}
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
          )}
        </div>
      </div>
    </>
  );
}
