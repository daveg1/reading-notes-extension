'use strict'

import './types/intl'
import { FragmentFactory } from './classes'
import { MIN_LENGTH_WITHOUT_CONTEXT } from './constants'
import { GenerateFragmentStatus } from './enums'
import { GenerateFragmentResult, TextFragment } from './interfaces'
import {
  recordStartTime,
  expandRangeStartToWordBound,
  expandRangeEndToWordBound,
  moveRangeEdgesToTextNodes,
  canUseExactMatch,
  normalizeString,
  isUniquelyIdentifying,
  getSearchSpaceForStart,
  getSearchSpaceForEnd,
  makeNewSegmenter,
  checkTimeout,
  TimeoutError,
} from './utils'

// export * from './textFragment'

/**
 * Code adapted from
 * https://github.com/GoogleChromeLabs/link-to-text-fragment/blob/main/fragment-generation-utils.js
 * With added types and simplifications
 */

/**
 * Attempts to generate a fragment, suitable for formatting and including in a
 * URL, which will highlight the given selection upon opening.
 */
export function generateFragment(
  selection: Selection,
  startTime = Date.now()
): GenerateFragmentResult {
  try {
    return doGenerateFragment(selection, startTime)
  } catch (err) {
    return {
      status:
        err instanceof TimeoutError
          ? GenerateFragmentStatus.TIMEOUT
          : GenerateFragmentStatus.EXECUTION_FAILED,
    }
  }
}

function doGenerateFragment(
  selection: Selection,
  startTime: number
): GenerateFragmentResult {
  recordStartTime(startTime)
  let range

  try {
    range = selection.getRangeAt(0)
  } catch {
    return {
      status: GenerateFragmentStatus.INVALID_SELECTION,
    }
  }

  expandRangeStartToWordBound(range)
  expandRangeEndToWordBound(range)

  // Keep a copy of the range before we try to shrink it to make it start and
  // end in text nodes. We need to use the range edges as starting points
  // for context term building, so it makes sense to start from the original
  // edges instead of the edges after shrinking. This way we don't have to
  // traverse all the non-text nodes that are between the edges after shrinking
  // and the original ones.
  const rangeBeforeShrinking = range.cloneRange()
  moveRangeEdgesToTextNodes(range)
  if (range.collapsed) {
    return {
      status: GenerateFragmentStatus.INVALID_SELECTION,
    }
  }
  let factory
  if (canUseExactMatch(range)) {
    const exactText = normalizeString(range.toString())
    const fragment: TextFragment = {
      textStart: exactText,
      prefix: '',
      suffix: '',
      textEnd: '',
    }
    // If the exact text is long enough to be used on its own, try this and skip
    // the longer process below.
    if (
      exactText.length >= MIN_LENGTH_WITHOUT_CONTEXT &&
      isUniquelyIdentifying(fragment)
    ) {
      return {
        status: GenerateFragmentStatus.SUCCESS,
        fragment: fragment,
      }
    }
    factory = new FragmentFactory().setExactTextMatch(exactText)
  } else {
    // We have to use textStart and textEnd to identify a range. First, break
    // the range up based on block boundaries, as textStart/textEnd can't cross
    // these.
    const startSearchSpace = getSearchSpaceForStart(range)
    const endSearchSpace = getSearchSpaceForEnd(range)
    if (startSearchSpace && endSearchSpace) {
      // If the search spaces are truthy, then there's a block boundary between
      // them.
      factory = new FragmentFactory().setStartAndEndSearchSpace(
        startSearchSpace,
        endSearchSpace
      )
    } else {
      // If the search space was empty/undefined, it's because no block boundary
      // was found. That means textStart and textEnd *share* a search space, so
      // our approach must ensure the substrings chosen as candidates don't
      // overlap.
      factory = new FragmentFactory().setSharedSearchSpace(
        range.toString().trim()
      )
    }
  }
  const prefixRange = document.createRange()
  prefixRange.selectNodeContents(document.body)

  const suffixRange = prefixRange.cloneRange()
  prefixRange.setEnd(
    rangeBeforeShrinking.startContainer,
    rangeBeforeShrinking.startOffset
  )

  suffixRange.setStart(
    rangeBeforeShrinking.endContainer,
    rangeBeforeShrinking.endOffset
  )

  const prefixSearchSpace = getSearchSpaceForEnd(prefixRange)
  const suffixSearchSpace = getSearchSpaceForStart(suffixRange)

  if (prefixSearchSpace || suffixSearchSpace) {
    factory.setPrefixAndSuffixSearchSpace(prefixSearchSpace, suffixSearchSpace)
  }

  factory.useSegmenter(makeNewSegmenter())

  let didEmbiggen = false

  do {
    checkTimeout()
    didEmbiggen = factory.embiggen()

    const fragment = factory.tryToMakeUniqueFragment()

    if (fragment != null) {
      return {
        status: GenerateFragmentStatus.SUCCESS,
        fragment: fragment,
      }
    }
  } while (didEmbiggen)

  return {
    status: GenerateFragmentStatus.AMBIGUOUS,
  }
}
