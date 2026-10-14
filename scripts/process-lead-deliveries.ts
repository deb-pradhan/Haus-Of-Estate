import "dotenv/config";

import { db } from "../src/lib/db";
import { isLeadDeliveryEnabled } from "../src/lib/lead-delivery/config";
import {
  leadDeliveryLogger,
  runConfiguredLeadDeliveryWorker,
} from "../src/lib/lead-delivery/runtime";

async function main(): Promise<void> {
  try {
    await runConfiguredLeadDeliveryWorker();
  } catch {
    leadDeliveryLogger.error("lead_delivery_worker_failed");
    process.exitCode = 1;
  } finally {
    if (isLeadDeliveryEnabled()) {
      try {
        await db.$disconnect();
      } catch {
        leadDeliveryLogger.error("lead_delivery_disconnect_failed");
        process.exitCode = 1;
      }
    }
  }
}

void main();
