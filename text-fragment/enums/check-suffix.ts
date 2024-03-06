/**
 * Enum indicating the result of the checkSuffix function.
 */
export const enum CheckSuffixResult {
  // Suffix wasn't found at all. Search should halt.
  NO_SUFFIX_MATCH = 0,
  // The suffix matches the expectation.
  SUFFIX_MATCH = 1,
  // The suffix was found, but not in the right place.
  MISPLACED_SUFFIX = 2,
}
