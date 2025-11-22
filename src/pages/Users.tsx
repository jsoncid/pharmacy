import { useEffect, useState } from "react";
import { Functions, ExecutionMethod, ID } from "appwrite";
import client from "../lib/appwrite";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import InputField from "../components/form/input/InputField";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Get paginated users
  const getPaginatedUsers = () => {
    const filtered = getFilteredUsers();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredUsers().length / itemsPerPage);

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
              <InputField
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
              <InputField
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <InputField
                type="password"
                placeholder="Password (min 8 chars)"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <Button
              size="sm"
              variant="primary"
              className="bg-green-600 hover:bg-green-700 px-5 py-3.5"
              onClick={createUser}
            >
              Create User
            </Button>
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
              <InputField
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : getFilteredUsers().length === 0 ? (
            <p className="text-gray-500">
              {usersList.length === 0 ? 'No users found.' : 'No users match your search.'}
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
                          Name
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Email
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
                      {getPaginatedUsers().map((user) => (
                        <TableRow key={user.$id}>
                          <TableCell className="px-5 py-4 text-start">
                            {editingUser === user.$id ? (
                              <input
                                type="text"
                                value={editUser.name}
                                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                              />
                            ) : (
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {user.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {editingUser === user.$id ? (
                              <input
                                type="email"
                                value={editUser.email}
                                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                              />
                            ) : (
                              <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                                {user.email}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {new Date(user.$createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            {editingUser === user.$id ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={updateUser}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                                  onClick={() => setEditingUser(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => startEdit(user)}
                              >
                                Edit
                              </Button>
                            )}
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
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, getFilteredUsers().length)} of {getFilteredUsers().length} users
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
    </>
  );
}
