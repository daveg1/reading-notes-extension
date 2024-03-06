import {
  BOUNDARY_CHARS,
  ITERATIONS_BEFORE_ADDING_CONTEXT,
  MIN_LENGTH_WITHOUT_CONTEXT,
  NON_BOUNDARY_CHARS,
  WORDS_TO_ADD_FIRST_ITERATION,
  WORDS_TO_ADD_SUBSEQUENT_ITERATIONS,
} from '../constants'
import { TextFragment } from '../interfaces'
import { checkTimeout, isUniquelyIdentifying, reverseString } from '../utils'

/**
 * Helper class for constructing range-based fragments for selections that cross
 * block boundaries.
 */
export class FragmentFactory {
  /**
   * Exactly one of the following should be called after an instance of this class is created:
   * setStartAndEndSearchSpace
   * setSharedSearchSpace
   * setExactTextMatch
   *
   * and optionally:
   * setPrefixAndSuffixSearchSpace
   *
   * TODO handle this in constructor
   */
  mode: number
  Mode = {
    ALL_PARTS: 1,
    SHARED_START_AND_END: 2,
    CONTEXT_ONLY: 3,
  }
  startOffset = -1
  endOffset = -1
  prefixOffset = -1
  suffixOffset = -1
  prefixSearchSpace = ''
  backwardsPrefixSearchSpace = ''
  suffixSearchSpace = ''
  numIterations = 0
  exactTextMatch = ''
  startSearchSpace = ''
  endSearchSpace = ''
  backwardsEndSearchSpace = ''
  sharedSearchSpace = ''
  backwardsSharedSearchSpace = ''
  startSegments: Intl.Segments | null = null
  endSegments: Intl.Segments | null = null
  sharedSegments: Intl.Segments | null = null
  prefixSegments: Intl.Segments | null = null
  suffixSegments: Intl.Segments | null = null

  /**
   * Generates a fragment based on the current state, then tests it for
   * uniqueness.
   */
  tryToMakeUniqueFragment(): TextFragment | undefined {
    let fragment: TextFragment = {
      textStart: '',
      textEnd: '',
      prefix: '',
      suffix: '',
    }

    if (this.mode === this.Mode.CONTEXT_ONLY) {
      fragment.textStart = this.exactTextMatch
    } else {
      fragment.textStart = this.getStartSearchSpace()
        .substring(0, this.startOffset)
        .trim()

      fragment.textEnd = this.getEndSearchSpace()
        .substring(this.endOffset)
        .trim()
    }

    if (this.prefixOffset != null) {
      const prefix = this.getPrefixSearchSpace()
        .substring(this.prefixOffset)
        .trim()

      if (prefix) {
        fragment.prefix = prefix
      }
    }
    if (this.suffixOffset != null) {
      const suffix = this.getSuffixSearchSpace()
        .substring(0, this.suffixOffset)
        .trim()

      if (suffix) {
        fragment.suffix = suffix
      }
    }
    return isUniquelyIdentifying(fragment) ? fragment : undefined
  }

  /**
   * Shifts the current state such that the candidates for textStart and textEnd
   * represent more of the possible search spaces.
   */
  embiggen(): boolean {
    let canExpandRange = true
    if (this.mode === this.Mode.SHARED_START_AND_END) {
      if (this.startOffset! >= this.endOffset!) {
        // If the search space is shared between textStart and textEnd, then
        // stop expanding when textStart overlaps textEnd.
        canExpandRange = false
      }
    } else if (this.mode === this.Mode.ALL_PARTS) {
      // Stop expanding if both start and end have already consumed their full
      // search spaces.
      if (
        this.startOffset === this.getStartSearchSpace().length &&
        this.backwardsEndOffset() === this.getEndSearchSpace().length
      ) {
        canExpandRange = false
      }
    } else if (this.mode === this.Mode.CONTEXT_ONLY) {
      canExpandRange = false
    }

    if (canExpandRange) {
      const desiredIterations = this.getNumberOfRangeWordsToAdd()

      if (this.startOffset! < this.getStartSearchSpace().length) {
        let i = 0

        if (this.getStartSegments() != null) {
          while (
            i < desiredIterations &&
            this.startOffset! < this.getStartSearchSpace().length
          ) {
            this.startOffset = this.getNextOffsetForwards(
              this.getStartSegments()!,
              this.startOffset,
              this.getStartSearchSpace()
            )
            i++
          }
        } else {
          // We don't have a segmenter, so find the next boundary character
          // instead. Shift to the next boundary char, and repeat until we've
          // added a word char.
          let oldStartOffset = this.startOffset

          do {
            checkTimeout()
            const newStartOffset = this.getStartSearchSpace()
              .substring(this.startOffset! + 1)
              .search(BOUNDARY_CHARS)

            if (newStartOffset === -1) {
              this.startOffset = this.getStartSearchSpace().length
            } else {
              this.startOffset = this.startOffset! + 1 + newStartOffset
            }

            // Only count as an iteration if a word character was added.
            if (
              this.getStartSearchSpace()
                .substring(oldStartOffset, this.startOffset)
                .search(NON_BOUNDARY_CHARS) !== -1
            ) {
              oldStartOffset = this.startOffset
              i++
            }
          } while (
            this.startOffset < this.getStartSearchSpace().length &&
            i < desiredIterations
          )
        }

        // Ensure we don't have overlapping start and end offsets.
        if (this.mode === this.Mode.SHARED_START_AND_END) {
          this.startOffset = Math.min(this.startOffset, this.endOffset)
        }
      }

      if (this.backwardsEndOffset() < this.getEndSearchSpace().length) {
        let i = 0

        if (this.getEndSegments() != null) {
          while (i < desiredIterations && this.endOffset > 0) {
            this.endOffset = this.getNextOffsetBackwards(
              this.getEndSegments()!,
              this.endOffset
            )
            i++
          }
        } else {
          // No segmenter, so shift to the next boundary char, and repeat until
          // we've added a word char.
          let oldBackwardsEndOffset = this.backwardsEndOffset()

          do {
            checkTimeout()
            const newBackwardsOffset = this.getBackwardsEndSearchSpace()
              .substring(this.backwardsEndOffset() + 1)
              .search(BOUNDARY_CHARS)
            if (newBackwardsOffset === -1) {
              this.setBackwardsEndOffset(this.getEndSearchSpace().length)
            } else {
              this.setBackwardsEndOffset(
                this.backwardsEndOffset() + 1 + newBackwardsOffset
              )
            }
            // Only count as an iteration if a word character was added.
            if (
              this.getBackwardsEndSearchSpace()
                .substring(oldBackwardsEndOffset, this.backwardsEndOffset())
                .search(NON_BOUNDARY_CHARS) !== -1
            ) {
              oldBackwardsEndOffset = this.backwardsEndOffset()
              i++
            }
          } while (
            this.backwardsEndOffset() < this.getEndSearchSpace().length &&
            i < desiredIterations
          )
        }

        // Ensure we don't have overlapping start and end offsets.
        if (this.mode === this.Mode.SHARED_START_AND_END) {
          this.endOffset = Math.max(this.startOffset, this.endOffset)
        }
      }
    }

    let canExpandContext = false

    if (
      !canExpandRange ||
      this.startOffset + this.backwardsEndOffset() <
        MIN_LENGTH_WITHOUT_CONTEXT ||
      this.numIterations >= ITERATIONS_BEFORE_ADDING_CONTEXT
    ) {
      // Check if there's any unused search space left.
      if (
        (this.backwardsPrefixOffset() != null &&
          this.backwardsPrefixOffset() !==
            this.getPrefixSearchSpace().length) ||
        (this.suffixOffset != null &&
          this.suffixOffset !== this.getSuffixSearchSpace().length)
      ) {
        canExpandContext = true
      }
    }

    if (canExpandContext) {
      const desiredIterations = this.getNumberOfContextWordsToAdd()

      if (this.backwardsPrefixOffset() < this.getPrefixSearchSpace().length) {
        let i = 0

        if (this.getPrefixSegments() != null) {
          while (i < desiredIterations && this.prefixOffset > 0) {
            this.prefixOffset = this.getNextOffsetBackwards(
              this.getPrefixSegments()!,
              this.prefixOffset
            )
            i++
          }
        } else {
          // Shift to the next boundary char, and repeat until we've added a
          // word char.
          let oldBackwardsPrefixOffset = this.backwardsPrefixOffset()

          do {
            checkTimeout()
            const newBackwardsPrefixOffset =
              this.getBackwardsPrefixSearchSpace()
                .substring(this.backwardsPrefixOffset() + 1)
                .search(BOUNDARY_CHARS)
            if (newBackwardsPrefixOffset === -1) {
              this.setBackwardsPrefixOffset(
                this.getBackwardsPrefixSearchSpace().length
              )
            } else {
              this.setBackwardsPrefixOffset(
                this.backwardsPrefixOffset() + 1 + newBackwardsPrefixOffset
              )
            }
            // Only count as an iteration if a word character was added.
            if (
              this.getBackwardsPrefixSearchSpace()
                .substring(
                  oldBackwardsPrefixOffset,
                  this.backwardsPrefixOffset()
                )
                .search(NON_BOUNDARY_CHARS) !== -1
            ) {
              oldBackwardsPrefixOffset = this.backwardsPrefixOffset()
              i++
            }
          } while (
            this.backwardsPrefixOffset() < this.getPrefixSearchSpace().length &&
            i < desiredIterations
          )
        }
      }

      if (this.suffixOffset < this.getSuffixSearchSpace().length) {
        let i = 0

        if (this.getSuffixSegments() != null) {
          while (
            i < desiredIterations &&
            this.suffixOffset < this.getSuffixSearchSpace().length
          ) {
            this.suffixOffset = this.getNextOffsetForwards(
              this.getSuffixSegments()!,
              this.suffixOffset,
              this.getStartSearchSpace()
            )
            i++
          }
        } else {
          let oldSuffixOffset = this.suffixOffset

          do {
            checkTimeout()
            const newSuffixOffset = this.getSuffixSearchSpace()
              .substring(this.suffixOffset + 1)
              .search(BOUNDARY_CHARS)
            if (newSuffixOffset === -1) {
              this.suffixOffset = this.getSuffixSearchSpace().length
            } else {
              this.suffixOffset = this.suffixOffset + 1 + newSuffixOffset
            }

            // Only count as an iteration if a word character was added.
            if (
              this.getSuffixSearchSpace()
                .substring(oldSuffixOffset, this.suffixOffset)
                .search(NON_BOUNDARY_CHARS) !== -1
            ) {
              oldSuffixOffset = this.suffixOffset
              i++
            }
          } while (
            this.suffixOffset < this.getSuffixSearchSpace().length &&
            i < desiredIterations
          )
        }
      }
    }
    this.numIterations++

    // TODO: check if this exceeds the total length limit
    return canExpandRange || canExpandContext
  }

  /**
   * TODO: do in constructor
   * Sets up the factory for a range-based match with a highlight that crosses
   * block boundaries.
   *
   * Exactly one of this, setSharedSearchSpace, or setExactTextMatch should be
   * called so the factory can identify the fragment.
   */
  setStartAndEndSearchSpace(
    startSearchSpace: string,
    endSearchSpace: string
  ): FragmentFactory {
    this.startSearchSpace = startSearchSpace
    this.endSearchSpace = endSearchSpace
    this.backwardsEndSearchSpace = reverseString(endSearchSpace)
    this.startOffset = 0
    this.endOffset = endSearchSpace.length
    this.mode = this.Mode.ALL_PARTS
    return this
  }

  /**
   * TODO: do in constructor
   * Sets up the factory for a range-based match with a highlight that doesn't
   * cross block boundaries.
   *
   * Exactly one of this, setStartAndEndSearchSpace, or setExactTextMatch should
   * be called so the factory can identify the fragment.
   */
  setSharedSearchSpace(fullHighlightText: string): FragmentFactory {
    this.sharedSearchSpace = fullHighlightText
    this.backwardsSharedSearchSpace = reverseString(fullHighlightText)
    this.startOffset = 0
    this.endOffset = fullHighlightText.length
    this.mode = this.Mode.SHARED_START_AND_END
    return this
  }

  /**
   * TODO: do in constructor
   * Sets up the factory for an exact text match.
   *
   * Exactly one of this, setStartAndEndSearchSpace, or setSharedSearchSpace
   * should be called so the factory can identify the fragment.
   */
  setExactTextMatch(exactTextMatch: string): FragmentFactory {
    this.exactTextMatch = exactTextMatch
    this.mode = this.Mode.CONTEXT_ONLY
    return this
  }

  /**
   * TODO: do in constructor
   * Sets up the factory for context-based matches.
   */
  setPrefixAndSuffixSearchSpace(
    prefixSearchSpace: string,
    suffixSearchSpace: string
  ): FragmentFactory {
    if (prefixSearchSpace) {
      this.prefixSearchSpace = prefixSearchSpace
      this.backwardsPrefixSearchSpace = reverseString(prefixSearchSpace)
      this.prefixOffset = prefixSearchSpace.length
    }
    if (suffixSearchSpace) {
      this.suffixSearchSpace = suffixSearchSpace
      this.suffixOffset = 0
    }
    return this
  }

  /**
   * Sets up the factory to use an instance of Intl.Segmenter when identifying
   * the start/end of words. |segmenter| is not actually retained; instead it is
   * used to create segment objects which are cached.
   *
   * This must be called AFTER any calls to setStartAndEndSearchSpace,
   * setSharedSearchSpace, and/or setPrefixAndSuffixSearchSpace, as these search
   * spaces will be segmented immediately.
   *
   * @param segmenter
   */
  useSegmenter(segmenter: Intl.Segmenter | undefined): FragmentFactory {
    if (segmenter == null) {
      return this
    }
    if (this.mode === this.Mode.ALL_PARTS) {
      this.startSegments = segmenter.segment(this.startSearchSpace)
      this.endSegments = segmenter.segment(this.endSearchSpace)
    } else if (this.mode === this.Mode.SHARED_START_AND_END) {
      this.sharedSegments = segmenter.segment(this.sharedSearchSpace)
    }
    if (this.prefixSearchSpace) {
      this.prefixSegments = segmenter.segment(this.prefixSearchSpace)
    }
    if (this.suffixSearchSpace) {
      this.suffixSegments = segmenter.segment(this.suffixSearchSpace)
    }
    return this
  }

  /**
   * how many words should be added to the prefix and suffix
   * when embiggening. This changes depending on the current state of the
   * prefix/suffix, so it should be invoked once per embiggen, before either
   * is modified.
   */
  getNumberOfContextWordsToAdd(): number {
    return this.backwardsPrefixOffset() === 0 && this.suffixOffset === 0
      ? WORDS_TO_ADD_FIRST_ITERATION
      : WORDS_TO_ADD_SUBSEQUENT_ITERATIONS
  }

  /**
   * how many words should be added to textStart and textEnd
   * when embiggening. This changes depending on the current state of
   * textStart/textEnd, so it should be invoked once per embiggen, before
   * either is modified.
   */
  getNumberOfRangeWordsToAdd(): number {
    return this.startOffset === 0 && this.backwardsEndOffset() === 0
      ? WORDS_TO_ADD_FIRST_ITERATION
      : WORDS_TO_ADD_SUBSEQUENT_ITERATIONS
  }

  /**
   * Helper method for embiggening using Intl.Segmenter. Finds the next offset
   * to be tried in the forwards direction (i.e., a prefix of the search space).
   * @param segments - the output of segmenting the desired search
   *     space using Intl.Segmenter
   * @param offset - the current offset
   * @param searchSpace - the search space that was segmented
   */
  getNextOffsetForwards(
    segments: Intl.Segments,
    offset: number,
    searchSpace: string
  ): number {
    // Find the nearest wordlike segment and move to the end of it.
    let currentSegment = segments.containing(offset)
    while (currentSegment != null) {
      checkTimeout()
      const currentSegmentEnd =
        currentSegment.index + currentSegment.segment.length
      if (currentSegment.isWordLike) {
        return currentSegmentEnd
      }
      currentSegment = segments.containing(currentSegmentEnd)
    }
    // If we didn't find a wordlike segment by the end of the string, set the
    // offset to the full search space.
    return searchSpace.length
  }

  /**
   * Helper method for embiggening using Intl.Segmenter. Finds the next offset
   * to be tried in the backwards direction (i.e., a suffix of the search
   * space).
   * @param segments - the output of segmenting the desired search
   *     space using Intl.Segmenter
   * @param offset - the current offset
   * @returns - the next offset which should be tried.
   */
  getNextOffsetBackwards(segments: Intl.Segments, offset: number): number {
    // Find the nearest wordlike segment and move to the start of it.
    let currentSegment = segments.containing(offset)

    // Handle two edge cases:
    //     1. |offset| is at the end of the search space, so |currentSegment|
    //        is undefined
    //     2. We're already at the start of a segment, so moving to the start of
    //        |currentSegment| would be a no-op.
    // In both cases, the solution is to grab the segment immediately
    // prior to this offset.
    if (!currentSegment || offset == currentSegment.index) {
      // If offset is 0, this will return null, which is handled below.
      currentSegment = segments.containing(offset - 1)
    }
    while (currentSegment != null) {
      checkTimeout()
      if (currentSegment.isWordLike) {
        return currentSegment.index
      }
      currentSegment = segments.containing(currentSegment.index - 1)
    }
    // If we didn't find a wordlike segment by the start of the string,
    // set the offset to the full search space.
    return 0
  }

  /**
   * @return the string to be used as the search space for textStart
   */
  getStartSearchSpace(): string {
    return this.mode === this.Mode.SHARED_START_AND_END
      ? this.sharedSearchSpace
      : this.startSearchSpace
  }

  /**
   * @returns the result of segmenting the start search
   *     space using Intl.Segmenter, or undefined if a segmenter was not
   *     provided.
   */
  getStartSegments(): Intl.Segments | null {
    return this.mode === this.Mode.SHARED_START_AND_END
      ? this.sharedSegments
      : this.startSegments
  }

  /**
   * @return the string to be used as the search space for textEnd
   */
  getEndSearchSpace(): string {
    return this.mode === this.Mode.SHARED_START_AND_END
      ? this.sharedSearchSpace
      : this.endSearchSpace
  }

  /**
   * @returns the result of segmenting the end search
   *     space using Intl.Segmenter, or undefined if a segmenter was not
   *     provided.
   */
  getEndSegments(): Intl.Segments | null {
    return this.mode === this.Mode.SHARED_START_AND_END
      ? this.sharedSegments
      : this.endSegments
  }

  /**
   * @return the string to be used as the search space for textEnd,
   *     backwards.
   */
  getBackwardsEndSearchSpace(): string {
    return this.mode === this.Mode.SHARED_START_AND_END
      ? this.backwardsSharedSearchSpace
      : this.backwardsEndSearchSpace
  }

  /**
   * @return the string to be used as the search space for prefix
   */
  getPrefixSearchSpace(): string {
    return this.prefixSearchSpace
  }

  /**
   * @returns the result of segmenting the prefix
   *     search space using Intl.Segmenter, or undefined if a segmenter was not
   *     provided.
   */
  getPrefixSegments(): Intl.Segments | null {
    return this.prefixSegments
  }

  /**
   * @return the string to be used as the search space for prefix,
   *     backwards.
   */
  getBackwardsPrefixSearchSpace(): string {
    return this.backwardsPrefixSearchSpace
  }

  /**
   * @return the string to be used as the search space for suffix
   */
  getSuffixSearchSpace(): string {
    return this.suffixSearchSpace
  }

  /**
   * @returns the result of segmenting the suffix
   *     search space using Intl.Segmenter, or undefined if a segmenter was not
   *     provided.
   */
  getSuffixSegments(): Intl.Segments | null {
    return this.suffixSegments
  }

  /**
   * Helper method for doing arithmetic in the backwards search space.
   * @return {Number} - the current end offset, as a start offset in the
   *     backwards search space
   */
  backwardsEndOffset() {
    return this.getEndSearchSpace().length - this.endOffset
  }

  /**
   * Helper method for doing arithmetic in the backwards search space.
   * @param {Number} backwardsEndOffset - the desired new value of the start
   *     offset in the backwards search space
   */
  setBackwardsEndOffset(backwardsEndOffset) {
    this.endOffset = this.getEndSearchSpace().length - backwardsEndOffset
  }

  /**
   * Helper method for doing arithmetic in the backwards search space.
   * @return {Number} - the current prefix offset, as a start offset in the
   *     backwards search space
   */
  backwardsPrefixOffset(): number {
    if (this.prefixOffset == null) return 0
    return this.getPrefixSearchSpace().length - this.prefixOffset
  }

  /**
   * Helper method for doing arithmetic in the backwards search space.
   * @param {Number} backwardsPrefixOffset - the desired new value of the prefix
   *     offset in the backwards search space
   */
  setBackwardsPrefixOffset(backwardsPrefixOffset) {
    if (this.prefixOffset == null) return
    this.prefixOffset =
      this.getPrefixSearchSpace().length - backwardsPrefixOffset
  }
}
