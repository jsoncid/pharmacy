import { useEffect, useState } from "react";
import { Teams, ID } from "appwrite";
import client from "../lib/appwrite";
import { useAuth } from "../context/AuthContext";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

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
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };


  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setEditName("");
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
          <h4 className="mb-3 text-base font-medium">Create New Team</h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
            />
            <button
              onClick={createTeam}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none"
            >
              Create
            </button>
          </div>
        </div>

        {/* Teams List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="mb-3 text-base font-medium">Teams</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3">
              {getFilteredTeams().map((team) => (
                <div key={team.$id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 shadow-md dark:border-gray-700">
                  {editingTeam?.$id === team.$id ? (
                    <div className="flex flex-1 gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                      />
                      <button
                        onClick={updateTeam}
                        className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded bg-gray-600 px-3 py-1 text-white hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h5 className="font-medium text-sm">{team.name}</h5>
                        <p className="text-xs text-gray-500">ID: {team.$id}</p>
                        <p className="text-xs text-gray-500">Members: {team.total}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(team)}
                          className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {getFilteredTeams().length === 0 && (
                <p className="text-gray-500">
                  {teamsList.length === 0 ? 'No teams found.' : 'No teams match your search.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
