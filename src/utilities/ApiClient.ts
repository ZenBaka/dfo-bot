import * as Routes from './Routes';
import logger from './Logger';

const DEFAULT_TIMEOUT = 10_000; // 10 seconds
const CIRCUIT_BREAKER_THRESHOLD = 3; // consecutive failures before opening
const CIRCUIT_BREAKER_COOLDOWN = 30_000; // 30 seconds before retrying

class CircuitBreaker {
  private failures: number = 0;
  private openUntil: number = 0;

  isOpen(): boolean {
    if (this.openUntil > Date.now()) return true;
    if (this.openUntil > 0 && Date.now() >= this.openUntil) {
      // Half-open: allow one request through to test
      this.openUntil = 0;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openUntil = 0;
  }

  recordFailure(): void {
    this.failures++;
    if (this.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.openUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
      logger.warn(
        `[ApiClient] Circuit breaker OPEN — API unreachable after ${this.failures} failures. Retrying in ${CIRCUIT_BREAKER_COOLDOWN / 1000}s`
      );
    }
  }
}

const breaker = new CircuitBreaker();

/**
 * Centralized API fetch wrapper.
 * Provides: default headers, request timeout, circuit breaker, structured error context.
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  if (breaker.isOpen()) {
    throw new ApiError(
      'API_UNAVAILABLE',
      'The game server is temporarily unreachable. Please try again in a moment.',
      503
    );
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...Routes.HEADERS(),
        ...options?.headers
      },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    });

    if (
      res.ok ||
      res.status === 429 ||
      res.status === 409 ||
      res.status === 404
    ) {
      // These are "expected" statuses the bot knows how to handle
      breaker.recordSuccess();
    } else if (res.status >= 500) {
      breaker.recordFailure();
    }

    return res;
  } catch (err: any) {
    breaker.recordFailure();

    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new ApiError(
        'API_TIMEOUT',
        'The game server took too long to respond. Please try again.',
        408
      );
    }

    throw new ApiError(
      'API_NETWORK_ERROR',
      'Could not reach the game server. Please try again later.',
      503
    );
  }
}

/**
 * Structured API error with a code the bot can switch on
 * and a user-friendly message ready to display.
 */
export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(code: string, message: string, status: number = 500) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}
