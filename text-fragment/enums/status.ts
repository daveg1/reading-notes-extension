/**
 * Enum indicating the success, or failure reason, of generateFragment
 */
export const enum GenerateFragmentStatus {
  // A fragment was generated
  SUCCESS = 0,
  // The selection provided could not be used
  INVALID_SELECTION = 1,
  // No unique fragment could be identified for this selection
  AMBIGUOUS = 2,
  // Computation could not complete in time
  TIMEOUT = 3,
  // An exception was raised during generation
  EXECUTION_FAILED = 4,
}
