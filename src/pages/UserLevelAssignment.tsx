import { useState, useEffect } from 'react';
import { Databases, ID, Query, Functions, ExecutionMethod } from 'appwrite';
import client from '../lib/appwrite';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

const databases = new Databases(client);
const functionsAPI = new Functions(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '69212b52002578ecb071';
const COLLECTION_ID = '69214284002bd9a24756'; // User Level Assignments collection

interface UserLevelAssignment {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user_id: string;
  userLevelToTeams: string; // Reference to user_level_to_teams document ID
  level_description?: string; // Optional field for immediate display
}

interface User {
  $id: string;
  name: string;
  email: string;
}

interface UserLevel {
  $id: string;
  level_description: string;
  teams_and_roles: string[];
  status: boolean;
}

export default function UserLevelAssignmentPage() {
  const [assignments, setAssignments] = useState<UserLevelAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableLevels, setAvailableLevels] = useState<UserLevel[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAssignments();
    fetchUsers();
    fetchLevels();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.orderDesc('$createdAt')
      ]);
      setAssignments(response.documents as unknown as UserLevelAssignment[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  // Populate level descriptions when levels are loaded
  useEffect(() => {
    if (availableLevels.length > 0 && assignments.length > 0) {
      setAssignments(prevAssignments =>
        prevAssignments.map(assignment => {
          // Only update if level_description is not already set
          if (!assignment.level_description) {
            const level = availableLevels.find(l => l.$id === assignment.userLevelToTeams);
            return {
              ...assignment,
              level_description: level?.level_description
            };
          }
          return assignment;
        }) as UserLevelAssignment[]
      );
    }
  }, [availableLevels, assignments.length]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await functionsAPI.createExecution('692138640030e8b19936', '', false, '/users', ExecutionMethod.GET, {});
      const result = JSON.parse(response.responseBody);
      if (result.success) {
        setAvailableUsers(result.data || []);
      } else {
        console.error('Error fetching users:', result.error);
        setAvailableUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setAvailableUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Filter users who don't already have assignments, but include current user being edited
  const getFilteredUsers = () => {
    const assignedUserIds = assignments
      .filter(assignment => assignment.$id !== editingId) // Exclude current assignment being edited
      .map(assignment => assignment.user_id);
    return availableUsers.filter(user => !assignedUserIds.includes(user.$id));
  };

  // Filter assignments based on search query
  const getFilteredAssignments = () => {
    if (!searchQuery.trim()) {
      return assignments;
    }

    const query = searchQuery.toLowerCase();
    return assignments.filter(assignment => {
      const user = availableUsers.find(u => u.$id === assignment.user_id);
      const levelDescription = assignment.level_description ||
        (availableLevels.find(l => l.$id === assignment.userLevelToTeams)?.level_description);

      // Search through user name, email, and level description
      const userName = user?.name?.toLowerCase() || '';
      const userEmail = user?.email?.toLowerCase() || '';
      const levelDesc = levelDescription?.toLowerCase() || '';

      return userName.includes(query) ||
             userEmail.includes(query) ||
             levelDesc.includes(query);
    });
  };

  const validateAssignmentUpdate = (userId: string, currentAssignmentId: string): string | null => {
    // Check if another user already has this assignment (excluding current assignment)
    const existingAssignment = assignments.find(
      assignment => assignment.user_id === userId && assignment.$id !== currentAssignmentId
    );

    if (existingAssignment) {
      return `User already has an assignment. Please choose a different user.`;
    }

    return null; // No validation errors
  };

  const fetchLevels = async () => {
    try {
      setLevelsLoading(true);
      const response = await databases.listDocuments(DATABASE_ID, '6921426f00185058212c', [
        Query.equal('status', true),
        Query.orderDesc('$createdAt')
      ]);
      setAvailableLevels(response.documents as unknown as UserLevel[]);
    } catch (err) {
      console.error('Error fetching user levels:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user levels');
    } finally {
      setLevelsLoading(false);
    }
  };

  const createAssignment = async (userId: string, levelId: string) => {
    try {
      setError(null);

      // Validate that user doesn't already have an assignment
      const existingAssignment = assignments.find(assignment => assignment.user_id === userId);
      if (existingAssignment) {
        const errorMessage = 'This user already has an assignment. Please choose a different user.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Validate that the selected level exists
      const selectedLevel = availableLevels.find(level => level.$id === levelId);
      if (!selectedLevel) {
        const errorMessage = 'Selected level is not available.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const newAssignment = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          user_id: userId,
          userLevelToTeams: levelId,
        }
      );

      // Add level description to the assignment for immediate display
      const assignmentWithLevel = {
        ...newAssignment,
        level_description: selectedLevel.level_description
      };

      setAssignments(prev => [assignmentWithLevel as unknown as UserLevelAssignment, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create assignment';
      setError(errorMessage);
      throw err;
    }
  };

  const updateAssignment = async (id: string, userId: string, levelId: string) => {
    try {
      setError(null);

      // Validate the assignment update
      const validationError = validateAssignmentUpdate(userId, id);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      // Validate that the selected level exists
      const selectedLevel = availableLevels.find(level => level.$id === levelId);
      if (!selectedLevel) {
        const errorMessage = 'Selected level is not available.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const updatedAssignment = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id,
        {
          user_id: userId,
          userLevelToTeams: levelId,
        }
      );

      // Add level description to the assignment for immediate display
      const assignmentWithLevel = {
        ...updatedAssignment,
        level_description: selectedLevel.level_description
      };

      setAssignments(prev =>
        prev.map(assignment =>
          assignment.$id === id ? assignmentWithLevel as unknown as UserLevelAssignment : assignment
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update assignment';
      setError(errorMessage);
      throw err;
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedLevelId('');
    setIsEditing(false);
    setEditingId(null);
  };

  const startEditing = (assignment: UserLevelAssignment) => {
    setSelectedUserId(assignment.user_id);
    setSelectedLevelId(assignment.userLevelToTeams);
    setIsEditing(true);
    setEditingId(assignment.$id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editingId) {
        await updateAssignment(editingId, selectedUserId, selectedLevelId);
      } else {
        await createAssignment(selectedUserId, selectedLevelId);
      }
      resetForm();
    } catch (err) {
      // Error is already set in the functions
    }
  };

  return (
    <>
      <PageMeta
        title="User Level Assignment | VoteSense"
        description="Assign user levels and permissions to team members in VoteSense"
      />
      <PageBreadcrumb pageTitle="User Assignment" />
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-white/[0.03] lg:p-5">
        {/* <h3 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          User Level Assignment Management
        </h3> */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-md dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-4 font-medium text-gray-800 dark:text-white">
            {isEditing ? 'Edit Assignment' : 'Create New Assignment'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                User
              </label>
              {usersLoading ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">Loading users...</p>
              ) : getFilteredUsers().length === 0 ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {isEditing ? 'No other users available for reassignment' : 'No available users (all users already have assignments)'}
                </p>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  required
                >
                  <option value="">Select a user</option>
                  {getFilteredUsers().map((user) => (
                    <option key={user.$id} value={user.$id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Level
              </label>
              {levelsLoading ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">Loading user levels...</p>
              ) : availableLevels.length === 0 ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">No user levels available</p>
              ) : (
                <select
                  value={selectedLevelId}
                  onChange={(e) => setSelectedLevelId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  required
                >
                  <option value="">Select a user level</option>
                  {availableLevels.map((level) => (
                    <option key={level.$id} value={level.$id}>
                      {level.level_description}
                    </option>
                  ))}
                </select>
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
            <h4 className="font-medium text-gray-800 dark:text-white">Existing Assignments</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search assignments..."
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
              {getFilteredAssignments().map((assignment) => {
                const user = availableUsers.find(u => u.$id === assignment.user_id);
                // Use stored level_description first, then fallback to lookup
                const levelDescription = assignment.level_description ||
                  (availableLevels.find(l => l.$id === assignment.userLevelToTeams)?.level_description);

                return (
                  <div
                    key={assignment.$id}
                    className="rounded-lg border border-gray-200 bg-white p-3 shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div>
                            <h5 className="font-medium text-sm text-gray-800 dark:text-white">
                              {user ? user.name : `User ${assignment.user_id}`}
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.email}
                            </p>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Assigned Level: </span>
                            <span className="font-medium text-gray-800 dark:text-white">
                              {levelsLoading ? 'Loading...' : levelDescription || 'Level not found'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {new Date(assignment.$createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(assignment)}
                          className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
