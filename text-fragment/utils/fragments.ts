import { CheckSuffixResult } from '../enums'
import { TextFragment } from '../interfaces'
import {
  findTextInRange,
  advanceRangeStartPastOffset,
  advanceRangeStartToNonWhitespace,
  checkSuffix,
} from '.'

export function isUniquelyIdentifying(fragment: TextFragment): boolean {
  return processTextFragmentDirective(fragment).length === 1
}

/**
 * Searches the document for a given text fragment.
 *
 * @return Zero or more ranges within the document corresponding
 *     to the fragment. If the fragment corresponds to more than one location
 *     in the document (i.e., is ambiguous) then the first two matches will be
 *     returned (regardless of how many more matches there may be in the
 *     document).
 */
export function processTextFragmentDirective(
  textFragment: TextFragment,
  documentToProcess = document
): Range[] {
  const results: Range[] = []
  const searchRange = documentToProcess.createRange()
  searchRange.selectNodeContents(documentToProcess.body)

  while (!searchRange.collapsed && results.length < 2) {
    let potentialMatch

    if (textFragment.prefix) {
      const prefixMatch = findTextInRange(textFragment.prefix, searchRange)
      if (prefixMatch == null) {
        break
      }
      // Future iterations, if necessary, should start after the first
      // character of the prefix match.
      advanceRangeStartPastOffset(
        searchRange,
        prefixMatch.startContainer,
        prefixMatch.startOffset
      )

      // The search space for textStart is everything after the prefix and
      // before the end of the top-level search range, starting at the next
      // non- whitespace position.
      const matchRange = documentToProcess.createRange()
      matchRange.setStart(prefixMatch.endContainer, prefixMatch.endOffset)
      matchRange.setEnd(searchRange.endContainer, searchRange.endOffset)
      advanceRangeStartToNonWhitespace(matchRange)
      if (matchRange.collapsed) {
        break
      }
      potentialMatch = findTextInRange(textFragment.textStart, matchRange)
      // If textStart wasn't found anywhere in the matchRange, then there's
      // no possible match and we can stop early.
      if (potentialMatch == null) {
        break
      }

      // If potentialMatch is immediately after the prefix (i.e., its start
      // equals matchRange's start), this is a candidate and we should keep
      // going with this iteration. Otherwise, we'll need to find the next
      // instance (if any) of the prefix.
      if (
        potentialMatch.compareBoundaryPoints(
          Range.START_TO_START,
          matchRange
        ) !== 0
      ) {
        continue
      }
    } else {
      // With no prefix, just look directly for textStart.
      potentialMatch = findTextInRange(textFragment.textStart, searchRange)
      if (potentialMatch == null) {
        break
      }
      advanceRangeStartPastOffset(
        searchRange,
        potentialMatch.startContainer,
        potentialMatch.startOffset
      )
    }
    if (textFragment.textEnd) {
      const textEndRange = documentToProcess.createRange()
      textEndRange.setStart(
        potentialMatch.endContainer,
        potentialMatch.endOffset
      )
      textEndRange.setEnd(searchRange.endContainer, searchRange.endOffset)

      // Keep track of matches of the end term followed by suffix term
      // (if needed).
      // If no matches are found then there's no point in keeping looking
      // for matches of the start term after the current start term
      // occurrence.
      let matchFound = false

      // Search through the rest of the document to find a textEnd match.
      // This may take multiple iterations if a suffix needs to be found.
      while (!textEndRange.collapsed && results.length < 2) {
        const textEndMatch = findTextInRange(textFragment.textEnd, textEndRange)

        if (textEndMatch == null) {
          break
        }

        advanceRangeStartPastOffset(
          textEndRange,
          textEndMatch.startContainer,
          textEndMatch.startOffset
        )
        potentialMatch.setEnd(textEndMatch.endContainer, textEndMatch.endOffset)

        if (textFragment.suffix) {
          // If there's supposed to be a suffix, check if it appears after
          // the textEnd we just found.
          const suffixResult = checkSuffix(
            textFragment.suffix,
            potentialMatch,
            searchRange,
            documentToProcess
          )

          if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
            break
          } else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
            matchFound = true
            results.push(potentialMatch.cloneRange())
            continue
          } else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
            continue
          }
        } else {
          // If we've found textEnd and there's no suffix, then it's a
          // match!
          matchFound = true
          results.push(potentialMatch.cloneRange())
        }
      }

      // Stopping match search because suffix or textEnd are missing from
      // the rest of the search space.
      if (!matchFound) {
        break
      }
    } else if (textFragment.suffix) {
      // If there's no textEnd but there is a suffix, search for the suffix
      // after potentialMatch
      const suffixResult = checkSuffix(
        textFragment.suffix,
        potentialMatch,
        searchRange,
        documentToProcess
      )

      if (suffixResult === CheckSuffixResult.NO_SUFFIX_MATCH) {
        break
      } else if (suffixResult === CheckSuffixResult.SUFFIX_MATCH) {
        results.push(potentialMatch.cloneRange())
        advanceRangeStartPastOffset(
          searchRange,
          searchRange.startContainer,
          searchRange.startOffset
        )
        continue
      } else if (suffixResult === CheckSuffixResult.MISPLACED_SUFFIX) {
        continue
      }
    } else {
      results.push(potentialMatch.cloneRange())
    }
  }
  return results
}
