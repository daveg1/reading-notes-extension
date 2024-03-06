import { advanceRangeStartToNonWhitespace, findTextInRange } from '.'
import { CheckSuffixResult } from '../enums'

/**
 * Checks to see if potentialMatch satisfies the suffix conditions of this
 * Text Fragment.
 * @param {String} suffix - the suffix text to find
 * @param {Range} potentialMatch - the Range containing the match text.
 * @param {Range} searchRange - the Range in which to search for |suffix|.
 *     Regardless of the start boundary of this Range, nothing appearing before
 *     |potentialMatch| will be considered.
 * @param {Document} documentToProcess - document where to extract and mark
 *     fragments in.
 * @return {CheckSuffixResult} - enum value indicating that potentialMatch
 *     should be accepted, that the search should continue, or that the search
 *     should halt.
 */
export function checkSuffix(
  suffix: string,
  potentialMatch: Range,
  searchRange: Range,
  documentToProcess: Document
): CheckSuffixResult {
  const suffixRange = documentToProcess.createRange()
  suffixRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset)
  suffixRange.setEnd(searchRange.endContainer, searchRange.endOffset)
  advanceRangeStartToNonWhitespace(suffixRange)
  const suffixMatch = findTextInRange(suffix, suffixRange)
  // If suffix wasn't found anywhere in the suffixRange, then there's no
  // possible match and we can stop early.
  if (suffixMatch == null) {
    return CheckSuffixResult.NO_SUFFIX_MATCH
  }

  // If suffixMatch is immediately after potentialMatch (i.e., its start
  // equals suffixRange's start), this is a match. If not, we have to
  // start over from the beginning.
  if (
    suffixMatch.compareBoundaryPoints(Range.START_TO_START, suffixRange) !== 0
  ) {
    return CheckSuffixResult.MISPLACED_SUFFIX
  }
  return CheckSuffixResult.SUFFIX_MATCH
}
