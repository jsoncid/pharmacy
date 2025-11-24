import { useEffect, useState } from "react";
import { Databases, Query } from "appwrite";
import client from "../../lib/appwrite";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../../context/AuthContext";

interface NotificationRecord {
  $id: string;
  title?: string;
  message?: string;
  $createdAt?: string;
  is_read?: boolean;
}

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const NOTIFICATIONS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_NOTIFICATIONS;

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const pageLimit = 100;
        let all: NotificationRecord[] = [];
        let offset = 0;

        for (;;) {
          const res = await databases.listDocuments(
            DATABASE_ID,
            NOTIFICATIONS_COLLECTION_ID,
            [
              Query.equal("user_id", user.$id),
              Query.orderDesc("$createdAt"),
              Query.limit(pageLimit),
              Query.offset(offset),
            ],
          );

          const docs = res.documents as unknown as NotificationRecord[];
          all = all.concat(docs);

          if (docs.length < pageLimit) {
            break;
          }

          offset += pageLimit;
        }

        setNotifications(all);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load notifications",
        );
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchNotifications();
  }, [user]);

  const totalPages = Math.max(
    1,
    Math.ceil(notifications.length / itemsPerPage) || 1,
  );

  const paginatedItems = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: NOTIFICATIONS_COLLECTION_ID,
        documentId: notificationId,
        data: {
          is_read: true,
        },
      });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.$id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read",
      );
    }
  };

  return (
    <>
      <PageMeta
        title="Notifications"
        description="View all read and unread notifications"
      />
      <PageBreadcrumb pageTitle="Notifications" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              View all your read and unread notifications.
            </p>
          </div>
        </div>

        {authLoading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Loading user information...
            </p>
          </div>
        ) : !user ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              You need to be signed in to view notifications.
            </p>
          </div>
        ) : error ? (
          <p className="text-sm text-error-500">{error}</p>
        ) : loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Loading notifications...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Title
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Message
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Created At
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((notification) => (
                        <TableRow key={notification.$id}>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {notification.title || "Notification"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {notification.message || "-"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {notification.is_read ? (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                Read
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 cursor-pointer hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60"
                                onClick={() => {
                                  void handleMarkAsRead(notification.$id);
                                }}
                              >
                                Unread
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-600 text-theme-sm dark:text-gray-300">
                            {formatDateTime(notification.$createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="px-5 py-8 text-center text-gray-600 dark:text-gray-300"
                        >
                          You do not have any notifications yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
    </>
  );
}
