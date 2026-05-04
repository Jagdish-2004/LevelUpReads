/**
 * ws-server.js — Stateless WebSocket Server with Redis Pub/Sub
 * ─────────────────────────────────────────────────────────────
 * Architecture:
 *
 *   [API Route / Worker]
 *       │  publishes to Redis channel "leaderboard-updates"
 *       ▼
 *   [Redis Pub/Sub]
 *       │  fan-out to ALL ws-server instances
 *       ▼
 *   [ws-server instance A] → broadcasts to local WS clients
 *   [ws-server instance B] → broadcasts to local WS clients
 *
 * This means:
 *  - No shared in-process state between WS servers
 *  - Works behind a load balancer with multiple Node processes
 *  - Adding a new server instance automatically subscribes to Redis
 */

const WebSocket = require("ws");
const Redis = require("ioredis");
const pino = require("pino");
require("dotenv").config({ path: ".env.local" });

const log = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
  base: { service: "ws-server", pid: process.pid },
});

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const WS_PORT = parseInt(process.env.WS_PORT || "8080", 10);

// ── Redis connections ────────────────────────────────────────────────────────
// BullMQ and Pub/Sub require SEPARATE ioredis connections
const redisSub = new Redis(REDIS_URL, { lazyConnect: true });
const redisPub = new Redis(REDIS_URL, { lazyConnect: true });

redisSub.on("error", (err) => log.error({ err }, "Redis subscriber error"));
redisPub.on("error", (err) => log.error({ err }, "Redis publisher error"));

// ── WebSocket Server ─────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ port: WS_PORT });

log.info({ port: WS_PORT }, "WebSocket server starting");

// ── Pub/Sub channels ─────────────────────────────────────────────────────────
const CHANNELS = {
  LEADERBOARD: "leaderboard-updates",
  NOTIFICATIONS: "user-notifications",
};

// ── Subscribe to Redis channels ──────────────────────────────────────────────
async function startSubscription() {
  await redisSub.connect().catch(() => {}); // already connected in some envs
  await redisPub.connect().catch(() => {});

  await redisSub.subscribe(...Object.values(CHANNELS));
  log.info({ channels: Object.values(CHANNELS) }, "Subscribed to Redis channels");

  /**
   * When Redis broadcasts a message, forward it to all locally-connected
   * WebSocket clients on THIS server instance.
   * Clients on OTHER instances receive the same message via their own
   * Redis subscription — this is what makes it stateless.
   */
  redisSub.on("message", (channel, message) => {
    let payload;
    try {
      payload = JSON.parse(message);
    } catch {
      payload = { raw: message };
    }

    log.debug({ channel, clients: wss.clients.size }, "Broadcasting Redis message to WS clients");

    let sent = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ channel, ...payload }));
        sent++;
      }
    });

    log.info({ channel, sent }, "Message broadcast complete");
  });
}

// ── WebSocket connection handler ──────────────────────────────────────────────
wss.on("connection", async (ws, req) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const requestId = req.headers["x-request-id"] || `ws_${Date.now().toString(36)}`;
  const clientLog = log.child({ clientIp, requestId });

  clientLog.info("WebSocket client connected");

  // Send the current cached leaderboard immediately on connect
  try {
    const cached = await redisPub.get("leaderboard:top10");
    if (cached) {
      ws.send(JSON.stringify({
        channel: CHANNELS.LEADERBOARD,
        type: "leaderboard-snapshot",
        leaderboard: JSON.parse(cached),
        timestamp: Date.now(),
      }));
      clientLog.info("Sent cached leaderboard snapshot to new client");
    }
  } catch (err) {
    clientLog.error({ err }, "Failed to send initial leaderboard snapshot");
  }

  // Heartbeat — detect stale connections
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (rawMsg) => {
    try {
      const msg = JSON.parse(rawMsg.toString());
      clientLog.debug({ msg }, "Message received from client");

      // Example: client can publish a leaderboard refresh request
      if (msg.type === "REQUEST_LEADERBOARD_REFRESH") {
        redisPub.publish(CHANNELS.LEADERBOARD, JSON.stringify({
          type: "leaderboard-refresh-requested",
          requestedBy: requestId,
        }));
      }
    } catch {
      clientLog.warn("Received non-JSON message from client");
    }
  });

  ws.on("close", () => clientLog.info("WebSocket client disconnected"));
  ws.on("error", (err) => clientLog.error({ err }, "WebSocket client error"));
});

// ── Heartbeat interval — remove dead connections ─────────────────────────────
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      log.warn("Terminating stale WebSocket connection");
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);

wss.on("close", () => clearInterval(heartbeatInterval));

// ── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  log.info("SIGTERM received — shutting down WebSocket server");
  wss.close(() => log.info("WebSocket server closed"));
  await redisSub.quit();
  await redisPub.quit();
  process.exit(0);
});

// ── Boot ─────────────────────────────────────────────────────────────────────
startSubscription()
  .then(() => log.info({ port: WS_PORT }, "WebSocket server ready"))
  .catch((err) => {
    log.fatal({ err }, "Failed to start WebSocket server");
    process.exit(1);
  });

/**
 * Helper exported for use by API routes:
 * await publishLeaderboardUpdate({ leaderboard: topUsers })
 */
async function publishLeaderboardUpdate(data) {
  const pub = new Redis(REDIS_URL);
  await pub.publish(CHANNELS.LEADERBOARD, JSON.stringify({
    type: "leaderboard-update",
    ...data,
    timestamp: Date.now(),
  }));
  await pub.quit();
}

module.exports = { publishLeaderboardUpdate, CHANNELS };
