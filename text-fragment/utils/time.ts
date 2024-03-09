// Desired max run time, in ms. Can be overwritten.
let timeoutDurationMs = 500
let t0 = 0 // Start timestamp for fragment generation

export class TimeoutError extends Error {
  isTimeout = true
}

/**
 * Allows overriding the max runtime to specify a different interval. Fragment
 * generation will halt and throw an error after this amount of time.
 */
export function setTimeout(newTimeoutDurationMs: number): void {
  timeoutDurationMs = newTimeoutDurationMs
}

/**
 * Call at the start of fragment generation to set the baseline for timeout
 * checking.
 */
export function recordStartTime(): void {
  t0 = Date.now()
}

export function checkTimeout() {
  // disable check when no timeout duration specified
  if (timeoutDurationMs === null) {
    return
  }

  const delta = Date.now() - t0

  if (delta > timeoutDurationMs) {
    const timeoutError = new TimeoutError(
      `Fragment generation timed out after ${delta} ms.`
    )

    throw timeoutError
  }
}
