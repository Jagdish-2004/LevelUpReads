import { bookWorker } from "./bookWorker";
import { reviewWorker } from "./reviewWorker";
import favouriteWorker from "./favouriteWorker";

console.log("🚀 BullMQ Workers Started!");

// Keep the process alive
process.on("SIGINT", async () => {
  await bookWorker.close();
  await reviewWorker.close();
  await favouriteWorker.close();
  process.exit(0);
});
