import { bookWorker } from "./bookWorker";
import { reviewWorker } from "./reviewWorker";

console.log("🚀 BullMQ Workers Started!");

// Keep the process alive
process.on('SIGINT', async () => {
  await bookWorker.close();
  await reviewWorker.close();
  process.exit(0);
});
