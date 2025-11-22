import { useEffect, useState } from "react";
import { Functions, ExecutionMethod, ID } from "appwrite";
import client from "../lib/appwrite";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

const functionsAPI = new Functions(client);

interface User {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  password?: string;
  email: string;
  emailVerification: boolean;
  status: boolean;
  prefs: Record<string, any>;
  // Add other user properties as needed
}

export default function UsersPage() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUser, setEditUser] = useState({ name: '', email: '', password: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await functionsAPI.createExecution('692138640030e8b19936', '', false, '/users', ExecutionMethod.GET, {});
      const result = JSON.parse(response.responseBody);
      if (result.success) {
        setUsersList(result.data || []);
      } else {
        console.error('Error fetching users:', result.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user.$id);
    setEditUser({ name: user.name, email: user.email, password: '' });
  };


  const updateUser = async () => {
    if (!editingUser) return;
    try {
      const data = JSON.stringify(editUser);
      const response = await functionsAPI.createExecution('692138640030e8b19936', data, false, `/users/${editingUser}`, ExecutionMethod.PUT, {});
      const result = JSON.parse(response.responseBody);
      if (result.success) {
        setEditingUser(null);
        fetchUsers();
      } else {
        alert('Error updating user: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const createUser = async () => {
    try {
      const userData = { userId: ID.unique(), ...newUser };
      const data = JSON.stringify(userData);
      const response = await functionsAPI.createExecution('692138640030e8b19936', data, false, '/users', ExecutionMethod.POST, {});
      const result = JSON.parse(response.responseBody);
      if (result.success) {
        setNewUser({ name: '', email: '', password: '' });
        fetchUsers();
      } else {
        alert('Error creating user: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Filter users based on search query
  const getFilteredUsers = () => {
    if (!searchQuery.trim()) {
      return usersList;
    }

    const query = searchQuery.toLowerCase();
    return usersList.filter(user => {
      // Search in user name and email
      const userName = user.name?.toLowerCase() || '';
      const userEmail = user.email?.toLowerCase() || '';
      return userName.includes(query) || userEmail.includes(query);
    });
  };

  return (
    <>
      <PageMeta
        title="Users Management | VoteSense"
        description="View users and their team assignments in VoteSense"
      />
      <PageBreadcrumb pageTitle="User Management" />
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-white/[0.03] lg:p-5">

        {/* Create User */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-md dark:border-gray-700 dark:bg-gray-800/50">
            <h4 className="mb-3 text-base font-medium">Create User</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              />
              <input
                type="password"
                placeholder="Password (min 8 chars)"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
            <button
              onClick={createUser}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none"
            >
              Create User
            </button>
      </div>
        {/* Users List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="mb-3 text-base font-medium">Users</h4>
              <p className="text-xs text-gray-500">
                All registered users in the system.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              {getFilteredUsers().map((user) => (
                <div key={user.$id} className="rounded-lg border border-gray-200 p-3 shadow-md dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {editingUser === user.$id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editUser.name}
                            onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                          />
                          <input
                            type="email"
                            value={editUser.email}
                            onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                          />
                          <input
                            type="password"
                            placeholder="New Password (leave empty to keep current)"
                            value={editUser.password}
                            onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                          />
                          <div className="space-x-2">
                            <button
                              onClick={updateUser}
                              className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="rounded bg-gray-600 px-3 py-1 text-white hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h5 className="font-medium text-sm">{user.name}</h5>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {getFilteredUsers().length === 0 && (
                <p className="text-gray-500">
                  {usersList.length === 0 ? 'No users found.' : 'No users match your search.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
