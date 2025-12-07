import { useEffect, useState } from "react";
import { Databases } from "appwrite";
import client from "../../lib/appwrite";

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const LOCATION_AISLES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_aisles;
const LOCATION_RACKS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_racks;
const LOCATION_SHELVES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_shelves;
const LOCATION_BINS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_COLLECTION_location_bins;

interface LocationAisleRecord {
  $id: string;
  description?: string;
}

interface LocationRackRecord {
  $id: string;
  description?: string;
  locationAisles?: string;
}

interface LocationShelfRecord {
  $id: string;
  description?: string;
  locationRacks?: string;
}

interface LocationBinRecord {
  $id: string;
  description?: string;
  locationShelves?: string;
}

interface UseLocationDetailsResult {
  aisle: LocationAisleRecord | null;
  rack: LocationRackRecord | null;
  shelf: LocationShelfRecord | null;
  bin: LocationBinRecord | null;
  loading: boolean;
  error: string | null;
}

const useLocationDetails = (
  binId?: string | null,
): UseLocationDetailsResult => {
  const [aisle, setAisle] = useState<LocationAisleRecord | null>(null);
  const [rack, setRack] = useState<LocationRackRecord | null>(null);
  const [shelf, setShelf] = useState<LocationShelfRecord | null>(null);
  const [bin, setBin] = useState<LocationBinRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!binId) {
      setAisle(null);
      setRack(null);
      setShelf(null);
      setBin(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        const binDoc = await databases.getDocument(
          DATABASE_ID,
          LOCATION_BINS_COLLECTION_ID,
          binId,
        );

        if (cancelled) return;

        const binRecord = binDoc as unknown as LocationBinRecord;
        setBin(binRecord);

        let shelfRecord: LocationShelfRecord | null = null;
        let rackRecord: LocationRackRecord | null = null;
        let aisleRecord: LocationAisleRecord | null = null;

        if (binRecord.locationShelves) {
          const shelfDoc = await databases.getDocument(
            DATABASE_ID,
            LOCATION_SHELVES_COLLECTION_ID,
            binRecord.locationShelves,
          );
          if (cancelled) return;
          shelfRecord = shelfDoc as unknown as LocationShelfRecord;
          setShelf(shelfRecord);
        } else {
          setShelf(null);
        }

        if (shelfRecord?.locationRacks) {
          const rackDoc = await databases.getDocument(
            DATABASE_ID,
            LOCATION_RACKS_COLLECTION_ID,
            shelfRecord.locationRacks,
          );
          if (cancelled) return;
          rackRecord = rackDoc as unknown as LocationRackRecord;
          setRack(rackRecord);
        } else {
          setRack(null);
        }

        if (rackRecord?.locationAisles) {
          const aisleDoc = await databases.getDocument(
            DATABASE_ID,
            LOCATION_AISLES_COLLECTION_ID,
            rackRecord.locationAisles,
          );
          if (cancelled) return;
          aisleRecord = aisleDoc as unknown as LocationAisleRecord;
          setAisle(aisleRecord);
        } else {
          setAisle(null);
        }
      } catch (err) {
        if (!cancelled) {
          setAisle(null);
          setRack(null);
          setShelf(null);
          setBin(null);
          setError(
            err instanceof Error ? err.message : "Failed to load location",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchLocation();

    return () => {
      cancelled = true;
    };
  }, [binId]);

  return { aisle, rack, shelf, bin, loading, error };
};

interface LocationDescriptionDetailsProps {
  binId?: string | null;
  className?: string;
}

const LocationDescriptionDetails = ({
  binId,
  className = "",
}: LocationDescriptionDetailsProps) => {
  const { aisle, rack, shelf, bin, loading, error } = useLocationDetails(binId);

  const rootClassName = className
    ? `flex flex-col ${className}`
    : "flex flex-col";

  if (!binId) {
    return <div className={rootClassName}>-</div>;
  }

  const hasAny = aisle || rack || shelf || bin;

  return (
    <div className={rootClassName}>
      {aisle?.description && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Aisle: {aisle.description}
        </span>
      )}
      {rack?.description && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Rack: {rack.description}
        </span>
      )}
      {shelf?.description && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Shelf: {shelf.description}
        </span>
      )}
      {bin?.description && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Bin: {bin.description}
        </span>
      )}
      {!hasAny && !loading && !error && (
        <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
      )}
      {loading && !bin && (
        <span className="text-xs text-gray-400">Loading location...</span>
      )}
      {error && (
        <span className="text-xs text-error-500">Failed to load location</span>
      )}
    </div>
  );
};

export default LocationDescriptionDetails;
