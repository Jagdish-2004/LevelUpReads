import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Singleton structured logger.
 * In development: pretty-printed, colorized output.
 * In production: JSON (machine-readable for log aggregators like Datadog/Loki).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
  base: {
    service: "levelupreads",
    env: process.env.NODE_ENV || "development",
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({ method: req.method, url: req.url, requestId: req.headers?.["x-request-id"] }),
  },
});

/**
 * Creates a child logger bound to a specific requestId and optional module context.
 * Used across API routes and background workers for distributed tracing.
 *
 * @example
 * const log = createContextLogger("bookService", "req_abc123");
 * log.info({ query }, "Fetching books from Open Library");
 */
export function createContextLogger(module: string, requestId?: string) {
  return logger.child({
    module,
    requestId: requestId ?? `sys_${Date.now().toString(36)}`,
  });
}

export default logger;
