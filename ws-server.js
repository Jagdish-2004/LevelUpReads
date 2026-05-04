const WebSocket = require("ws");
const Redis = require("ioredis");
require("dotenv").config({ path: ".env.local" });

const wss = new WebSocket.Server({ port: 8080 });
console.log("🔌 WebSocket Server running at ws://localhost:8080");

// Connect to Redis
const redisSubscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const CHANNEL = "leaderboard-updates";

redisSubscriber.subscribe(CHANNEL, (err, count) => {
  if (err) {
    console.error("Failed to subscribe to channel", err);
  } else {
    console.log(`Subscribed to ${count} channels. Listening for ${CHANNEL}...`);
  }
});

// Broadcast to all connected clients when a message is received from Redis
redisSubscriber.on("message", (channel, message) => {
  if (channel === CHANNEL) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
});

// Periodic fallback / init logic: Send the current cached leaderboard on connection
wss.on("connection", async (ws) => {
  console.log("New client connected!");
  try {
    const cachedLeaderboard = await redisClient.get("leaderboard:top10");
    if (cachedLeaderboard) {
      ws.send(JSON.stringify({
        type: "leaderboard-update",
        leaderboard: JSON.parse(cachedLeaderboard),
      }));
    }
  } catch (err) {
    console.error("Error fetching initial leaderboard", err);
  }
  
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
