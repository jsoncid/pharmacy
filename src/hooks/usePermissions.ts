import { useState, useEffect } from 'react';
import { Databases, Query } from 'appwrite';
import client from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '690dcbb000080ea766f3';
const USER_LEVEL_ASSIGNMENTS_COLLECTION_ID = '690dd880003cb0613960'; // User Level Assignments collection
const USER_LEVEL_TO_TEAMS_COLLECTION_ID = 'user_level_to_teams';

export function usePermissions() {
  const { user } = useAuth();
  const [userTeamIds, setUserTeamIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserTeamIds = async () => {
      try {
        // Query user level assignments for the current user
        const assignments = await databases.listDocuments(
          DATABASE_ID,
          USER_LEVEL_ASSIGNMENTS_COLLECTION_ID,
          [Query.equal('user_id', user.$id)]
        );

        if (assignments.documents.length > 0) {
          // Get the user level from the first assignment (assuming one primary level)
          const assignment = assignments.documents[0];
          const userLevelToTeamsId = assignment.userLevelToTeams;

          // Fetch the teams and roles from user_level_to_teams collection
          const levelDoc = await databases.getDocument(
            DATABASE_ID,
            USER_LEVEL_TO_TEAMS_COLLECTION_ID,
            userLevelToTeamsId
          );

          // Extract team IDs from teams_and_roles
          const teamsAndRoles = levelDoc.teams_and_roles || [];
          const teamIds = teamsAndRoles.map((item: string) => item.split(':')[0]);
          setUserTeamIds(teamIds);
        }
      } catch (error) {
        console.error('Error fetching user team IDs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTeamIds();
  }, [user]);

  const hasTeamId = (teamId: string) => userTeamIds.includes(teamId);

  return {
    userTeamIds,
    loading,
    hasTeamId,
  };
}
