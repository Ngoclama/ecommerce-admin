import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { ObjectId } from "bson";

const db = new PrismaClient();

const generateOrderNumber = () => randomUUID().replace(/-/g, "").slice(-12);

type RawId = any;

async function fetchMissingOrderIds(): Promise<RawId[]> {
  const res: any = await db.$runCommandRaw({
    find: "Order",
    filter: {
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: "" },
      ],
    },
    projection: { _id: 1 },
    limit: 50000,
  });

  const docs = res?.cursor?.firstBatch ?? [];
  return docs.map((d: { _id: RawId }) => d._id);
}

async function setOrderNumber(id: RawId, orderNumber: string) {
  const queryId =
    typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : id;
  const res: any = await db.$runCommandRaw({
    update: "Order",
    updates: [
      {
        q: { _id: queryId },
        u: { $set: { orderNumber } },
        upsert: false,
        multi: false,
      },
    ],
  });

  if (!res?.ok || res?.nModified === 0) {
    throw new Error(
      `Failed to update orderNumber for ${id}: ${JSON.stringify(res)}`
    );
  }
}

async function main() {
  const ids = await fetchMissingOrderIds();
  console.log(`Found ${ids.length} orders missing orderNumber`);

  for (const id of ids) {
    const orderNumber = generateOrderNumber();
    await setOrderNumber(id, orderNumber);
    console.log(`Updated ${id} -> ${orderNumber}`);
  }

  const remaining = await fetchMissingOrderIds();
  console.log(`Remaining missing orderNumber: ${remaining.length}`);
  console.log("Done backfilling orderNumber");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
