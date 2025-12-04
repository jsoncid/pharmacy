import { Client, Databases, Query } from 'node-appwrite';

// Inventory listing function
// - Reads from:
//   - VITE_APPWRITE_COLLECTION_INVENTORIES
//   - VITE_APPWRITE_COLLECTION_INVENTORY_DETAILS
//   - VITE_APPWRITE_COLLECTION_SELLING_PRICES
// - Builds a grouped structure by (productDescriptions, units)
// - Orders groups by productDescriptions then units (both by ID)

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(
      process.env.APPWRITE_FUNCTION_API_KEY ||
        req.headers['x-appwrite-key'] ||
        '',
    );

  const databases = new Databases(client);

  const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
  const INVENTORIES_COLLECTION_ID =
    process.env.VITE_APPWRITE_COLLECTION_INVENTORIES;
  const INVENTORY_DETAILS_COLLECTION_ID =
    process.env.VITE_APPWRITE_COLLECTION_INVENTORY_DETAILS;
  const SELLING_PRICES_COLLECTION_ID =
    process.env.VITE_APPWRITE_COLLECTION_SELLING_PRICES;

  if (
    !DATABASE_ID ||
    !INVENTORIES_COLLECTION_ID ||
    !INVENTORY_DETAILS_COLLECTION_ID ||
    !SELLING_PRICES_COLLECTION_ID
  ) {
    error('Missing required environment variables for database/collections');
    return res.json(
      {
        success: false,
        error: 'Missing database/collection configuration',
      },
      500,
    );
  }

  const listAllDocuments = async (collectionId, baseQueries = []) => {
    const pageLimit = 100;
    let offset = 0;
    let all = [];

    // Simple pagination loop until fewer than pageLimit docs are returned
    // to make sure we read the entire collection for the given filters.
    // This assumes the data size is reasonable for this function.
    // If the dataset grows very large, consider adding additional filters
    // or server-side aggregation.
    for (;;) {
      const response = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        [...baseQueries, Query.limit(pageLimit), Query.offset(offset)],
      );

      all = all.concat(response.documents || []);

      if (!response.documents || response.documents.length < pageLimit) {
        break;
      }

      offset += pageLimit;
    }

    return all;
  };

  try {
    // 1) Load all active inventories
    const inventories = await listAllDocuments(INVENTORIES_COLLECTION_ID, [
      Query.equal('status', true),
    ]);

    const inventoryIds = inventories.map((inv) => inv.$id);

    // 2) Load all inventory details attached to these inventories
    //    Grouping will be done in-memory.
    const details = await listAllDocuments(INVENTORY_DETAILS_COLLECTION_ID, [
      Query.equal('inventories', inventoryIds),
    ]);

    // 3) Load all selling prices so we can compute the latest price
    const prices = await listAllDocuments(SELLING_PRICES_COLLECTION_ID, []);

    // Build a map of latest price per inventory detail
    const latestPriceByDetail = {};
    for (const price of prices) {
      const detailId = price.inventoryDetails;
      if (!detailId) continue;

      const existing = latestPriceByDetail[detailId];
      if (!existing || price.$createdAt > existing.$createdAt) {
        latestPriceByDetail[detailId] = price;
      }
    }

    // 4) Group rows by (productDescriptions, units)
    const groupsByKey = {};

    for (const detail of details) {
      const inventoryId = detail.inventories;
      const inventory = inventories.find((inv) => inv.$id === inventoryId);
      if (!inventory) continue;

      const productId = inventory.productDescriptions || null;
      const unitId = detail.units || null;

      const key = `${productId || ''}::${unitId || ''}`;

      if (!groupsByKey[key]) {
        groupsByKey[key] = {
          productDescriptions: productId,
          unit: unitId,
          rows: [],
        };
      }

      const latestPriceDoc = latestPriceByDetail[detail.$id] || null;

      groupsByKey[key].rows.push({
        inventoryId,
        detailId: detail.$id,
        productDescriptions: productId,
        unit: unitId,
        date_expiry: inventory.date_expiry ?? null,
        lot_no: inventory.lot_no ?? null,
        batch_no: inventory.batch_no ?? null,
        running_balance: detail.running_balance ?? null,
        current_price:
          typeof latestPriceDoc?.price === 'number'
            ? latestPriceDoc.price
            : null,
        med_rep: detail.med_rep ?? null,
      });
    }

    // 5) Convert grouped map to array and order by productDescriptions + unit
    const groups = Object.values(groupsByKey);

    groups.sort((a, b) => {
      const aProd = (a.productDescriptions || '').toString();
      const bProd = (b.productDescriptions || '').toString();
      if (aProd !== bProd) return aProd.localeCompare(bProd);

      const aUnit = (a.unit || '').toString();
      const bUnit = (b.unit || '').toString();
      return aUnit.localeCompare(bUnit);
    });

    return res.json({
      success: true,
      totalGroups: groups.length,
      data: groups,
    });
  } catch (err) {
    error(`Failed to build inventory list: ${err.message}`);
    return res.json(
      {
        success: false,
        error: err.message || 'Failed to build inventory list',
      },
      500,
    );
  }
};
