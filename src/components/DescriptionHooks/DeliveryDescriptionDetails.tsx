import { useEffect, useState } from "react";
import { Databases } from "appwrite";
import client from "../../lib/appwrite";

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const DELIVERIES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_DELIVERIES;

interface DeliveryRecord {
  $id: string;
  delivery_receipt_no?: string;
  delivered_by?: string;
  delivered_date?: string;
}

interface UseDeliveryDetailsResult {
  delivery: DeliveryRecord | null;
  loading: boolean;
  error: string | null;
}

export const useDeliveryDetails = (
  deliveryId?: string | null,
): UseDeliveryDetailsResult => {
  const [delivery, setDelivery] = useState<DeliveryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deliveryId) {
      setDelivery(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDelivery = async () => {
      try {
        setLoading(true);
        setError(null);
        const doc = await databases.getDocument(
          DATABASE_ID,
          DELIVERIES_COLLECTION_ID,
          deliveryId,
        );
        if (!cancelled) {
          setDelivery(doc as unknown as DeliveryRecord);
        }
      } catch (err) {
        if (!cancelled) {
          setDelivery(null);
          setError(
            err instanceof Error ? err.message : "Failed to load delivery",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchDelivery();

    return () => {
      cancelled = true;
    };
  }, [deliveryId]);

  return { delivery, loading, error };
};

interface DeliveryDescriptionDetailsProps {
  deliveryId?: string | null;
  className?: string;
}

const DeliveryDescriptionDetails = ({
  deliveryId,
  className = "",
}: DeliveryDescriptionDetailsProps) => {
  const { delivery, loading, error } = useDeliveryDetails(deliveryId);

  const rootClassName = className
    ? `flex flex-col ${className}`
    : "flex flex-col";

  const receiptNo = delivery?.delivery_receipt_no;
  const deliveredBy = delivery?.delivered_by;
  const deliveredDate = delivery?.delivered_date
    ? delivery.delivered_date.split("T")[0] || delivery.delivered_date
    : undefined;

  if (!deliveryId) {
    return <div className={rootClassName}>-</div>;
  }

  return (
    <div className={rootClassName}>
      <span>{receiptNo || deliveryId}</span>
      {deliveredBy && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Delivered by: {deliveredBy}
        </span>
      )}
      {deliveredDate && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Delivered date: {deliveredDate}
        </span>
      )}
      {loading && !delivery && (
        <span className="text-xs text-gray-400">Loading delivery...</span>
      )}
      {error && (
        <span className="text-xs text-error-500">Failed to load delivery</span>
      )}
    </div>
  );
};

export default DeliveryDescriptionDetails;

