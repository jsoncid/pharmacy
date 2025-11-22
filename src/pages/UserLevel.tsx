import { useState, useEffect } from 'react';
import { Databases, ID, Query, Teams } from 'appwrite';
import client from '../lib/appwrite';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

const databases = new Databases(client);
const teams = new Teams(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '690dcbb000080ea766f3';
const COLLECTION_ID = 'user_level_to_teams';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Level Description
              </label>
              <input
                type="text"
                value={levelDescription}
                onChange={(e) => setLevelDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                required
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
                        <label className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleTeamToggle(team.$id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span className="font-medium text-xs text-gray-700 dark:text-gray-300">
                            {team.name} ({team.total} member/s)
                          </span>
                        </label>

                        {isSelected && (
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            {crudPermissions.map((permission) => (
                              <label key={permission} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={permissions.includes(permission)}
                                  onChange={(e) => handlePermissionToggle(team.$id, permission, e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                  {permission}
                                </span>
                              </label>
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
              <button
                type="submit"
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none"
              >
                {isEditing ? 'Update' : 'Create'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded bg-gray-600 px-3 py-1 text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Assignments List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-800 dark:text-white">Existing User Levels</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search levels and teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
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
            <div className="space-y-3">
              {getFilteredAssignments().map((assignment) => (
                <div
                  key={assignment.$id}
                  className="rounded-lg border border-gray-200 bg-white p-3 shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm text-gray-800 dark:text-white">
                        {assignment.level_description}
                      </h5>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(() => {
                          const teamsData = assignment.teams_and_roles;

                          if (Array.isArray(teamsData)) {
                            return teamsData.map(encodedTeam => {
                              let teamId: string;
                              let permissions: string[];

                              if (typeof encodedTeam === 'string') {
                                // Check if it's encoded with permissions (contains ':')
                                if (encodedTeam.includes(':')) {
                                  const [tid, permissionsStr] = encodedTeam.split(':');
                                  teamId = tid;
                                  permissions = permissionsStr ? permissionsStr.split(',') : [];
                                } else {
                                  // Old format: just team ID
                                  teamId = encodedTeam;
                                  permissions = ['create', 'read', 'update', 'delete']; // Default permissions
                                }
                              } else {
                                return null;
                              }

                              const team = availableTeams.find(t => t.$id === teamId);
                              return (
                                <div key={teamId} className="bg-gray-100 rounded-lg p-2 text-xs dark:bg-gray-700">
                                  <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                    {team ? team.name : teamId}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {permissions.map((permission) => (
                                      <span
                                        key={permission}
                                        className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs dark:bg-blue-900 dark:text-blue-200"
                                      >
                                        {permission}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          }

                          return null;
                        })()}
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(assignment.$createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(assignment)}
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
