import CircuitBreaker from "opossum";
import { createContextLogger } from "./logger";

const log = createContextLogger("circuitBreaker");

export interface CircuitBreakerOptions {
  timeout?: number;           // ms before the action is considered failed
  errorThresholdPercentage?: number; // % failures before circuit OPENS
  resetTimeout?: number;      // ms before trying again (half-open state)
  name?: string;
}

/**
 * Factory: wraps any async function in an Opossum circuit breaker.
 *
 * States:
 *  CLOSED  → requests pass through normally
 *  OPEN    → requests immediately fail fast (no call to upstream)
 *  HALF-OPEN → one test request sent; if it passes, circuit closes again
 *
 * @param fn   The async function to protect (e.g., an Axios call or DB query)
 * @param opts Tuning parameters
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  opts: CircuitBreakerOptions = {}
): CircuitBreaker<T> {
  const breaker = new CircuitBreaker(fn, {
    timeout: opts.timeout ?? 5000,                   // 5 s
    errorThresholdPercentage: opts.errorThresholdPercentage ?? 50, // open after 50% errors
    resetTimeout: opts.resetTimeout ?? 30_000,        // try again after 30 s
    volumeThreshold: 5,                               // minimum calls before stats are meaningful
    name: opts.name ?? fn.name ?? "anonymous",
  });

  const name = opts.name ?? fn.name ?? "anonymous";

  breaker.on("open", () =>
    log.warn({ breaker: name }, "Circuit OPENED — upstream is failing, fast-failing requests")
  );
  breaker.on("halfOpen", () =>
    log.info({ breaker: name }, "Circuit HALF-OPEN — sending one test request")
  );
  breaker.on("close", () =>
    log.info({ breaker: name }, "Circuit CLOSED — upstream recovered")
  );
  breaker.on("fallback", (result: any) =>
    log.warn({ breaker: name, result }, "Circuit fallback triggered")
  );
  breaker.on("timeout", () =>
    log.error({ breaker: name }, "Circuit action timed out")
  );

  return breaker;
}

/**
 * Convenience: wraps an async function with a fallback value when the circuit is open.
 *
 * @param fn       The guarded function
 * @param fallback Return this value when the circuit is open
 * @param opts     Circuit breaker tuning
 */
export function withFallback<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  fallback: Awaited<ReturnType<T>>,
  opts: CircuitBreakerOptions = {}
): CircuitBreaker<T> {
  const breaker = createCircuitBreaker(fn, opts);
  breaker.fallback(() => fallback);
  return breaker;
}
