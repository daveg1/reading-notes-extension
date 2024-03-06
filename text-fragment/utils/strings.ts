import {
  backwardTraverse,
  checkTimeout,
  forwardTraverse,
  getFirstNodeForBlockSearch,
  getLastNodeForBlockSearch,
  makeWalkerForNode,
} from '.'
import { BlockTextAccumulator } from '../classes'
import { BOUNDARY_CHARS } from '../constants'

/**
 * @return a normalized version of |str| with all consecutive
 *     whitespace chars converted to a single ' ' and all diacriticals removed
 *     (e.g., 'é' -> 'e').
 */
export function normalizeString(str: string): string {
  // First, decompose any characters with diacriticals. Then, turn all
  // consecutive whitespace characters into a standard " ", and strip out
  // anything in the Unicode U+0300..U+036F (Combining Diacritical Marks) range.
  // This may change the length of the string.
  return (str || '')
    .normalize('NFKD')
    .replace(/\s+/g, ' ')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Reverses a string, preserves compound unicode characters (e.g. emojis)
 */
export function reverseString(str: string): string {
  return [...(str || '')].reverse().join('')
}

/**
 * Returns the textContent of all the textNodes and normalizes strings by
 * replacing duplicated spaces with single space.
 */
export function getTextContent(
  nodes: Node[],
  startOffset: number,
  endOffset: number | undefined
): string {
  let str = ''

  if (nodes.length === 1) {
    str = nodes[0].textContent!.substring(startOffset, endOffset)
  } else {
    str =
      nodes[0].textContent!.substring(startOffset) +
      nodes.slice(1, -1).reduce((s, n) => s + n.textContent, '') +
      nodes.slice(-1)[0].textContent!.substring(0, endOffset)
  }

  return str.replace(/[\t\n\r ]+/g, ' ')
}

/**
 * Checks if a substring is word-bounded in the context of a longer string.
 *
 * If an Intl.Segmenter is provided for locale-specific segmenting, it will be
 * used for this check. This is the most desirable option, but not supported in
 * all browsers.
 *
 * If one is not provided, a heuristic will be applied,
 * returning true iff:
 *  - startPos == 0 OR char before start is a boundary char, AND
 *  - length indicates end of string OR char after end is a boundary char
 * Where boundary chars are whitespace/punctuation defined in the const above.
 * This causes the known issue that some languages, notably Japanese, only match
 * at the level of roughly a full clause or sentence, rather than a word.
 */
export function isWordBounded(
  text: string,
  startPos: number,
  length: number,
  segmenter: Intl.Segmenter
): boolean {
  if (
    startPos < 0 ||
    startPos >= text.length ||
    length <= 0 ||
    startPos + length > text.length
  ) {
    return false
  }

  if (segmenter) {
    // If the Intl.Segmenter API is available on this client, use it for more
    // reliable word boundary checking.

    const segments = segmenter.segment(text)
    const startSegment = segments.containing(startPos)
    if (!startSegment) return false
    // If the start index is inside a word segment but not the first character
    // in that segment, it's not word-bounded. If it's not a word segment, then
    // it's punctuation, etc., so that counts for word bounding.
    if (startSegment.isWordLike && startSegment.index != startPos) return false

    // |endPos| points to the first character outside the target substring.
    const endPos = startPos + length
    const endSegment = segments.containing(endPos)

    // If there's no end segment found, it's because we're at the end of the
    // text, which is a valid boundary. (Because of the preconditions we
    // checked above, we know we aren't out of range.)
    // If there's an end segment found but it's non-word-like, that's also OK,
    // since punctuation and whitespace are acceptable boundaries.
    // Lastly, if there's an end segment and it is word-like, then |endPos|
    // needs to point to the start of that new word, or |endSegment.index|.
    if (endSegment && endSegment.isWordLike && endSegment.index != endPos) {
      return false
    }
  } else {
    // We don't have Intl.Segmenter support, so fall back to checking whether or
    // not the substring is flanked by boundary characters.

    // If the first character is already a boundary, move it once.
    if (text[startPos].match(BOUNDARY_CHARS)) {
      ++startPos
      --length
      if (!length) {
        return false
      }
    }

    // If the last character is already a boundary, move it once.
    if (text[startPos + length - 1].match(BOUNDARY_CHARS)) {
      --length
      if (!length) {
        return false
      }
    }

    if (startPos !== 0 && !text[startPos - 1].match(BOUNDARY_CHARS)) {
      return false
    }

    if (
      startPos + length !== text.length &&
      !text[startPos + length].match(BOUNDARY_CHARS)
    )
      return false
  }

  return true
}

/**
 * Finds the search space for parameters when using range or suffix match.
 * This is the text from the start of the range to the first block boundary,
 * trimmed to remove any leading/trailing whitespace characters.
 * @return - the text which may be used for constructing a
 *     textStart parameter identifying this range. Will return undefined if no
 *     block boundaries are found inside this range, or if all the candidate
 *     ranges were empty (or included only whitespace characters).
 */
export function getSearchSpaceForStart(range: Range): string | undefined {
  let node: Node | null = getFirstNodeForBlockSearch(range)
  const walker = makeWalkerForNode(node, range.endContainer)

  if (!walker) {
    return undefined
  }

  const finishedSubtrees = new Set<Node>()
  // If the range starts after the last child of an element node
  // don't visit its subtree because it's not included in the range.
  if (
    range.startContainer.nodeType === Node.ELEMENT_NODE &&
    range.startOffset === range.startContainer.childNodes.length
  ) {
    finishedSubtrees.add(range.startContainer)
  }

  const origin = node
  const textAccumulator = new BlockTextAccumulator(range, true)
  // tempRange monitors whether we've exhausted our search space yet.
  const tempRange = range.cloneRange()

  while (!tempRange.collapsed && node != null) {
    checkTimeout()
    // Depending on whether |node| is an ancestor of the start of our
    // search, we use either its leading or trailing edge as our start.
    if (node.contains(origin)) {
      tempRange.setStartAfter(node)
    } else {
      tempRange.setStartBefore(node)
    }

    // Add node to accumulator to keep track of text inside the current block
    // boundaries
    textAccumulator.appendNode(node)

    // If the accumulator found a non empty block boundary we've got our search
    // space.
    if (textAccumulator.textInBlock !== null) {
      return textAccumulator.textInBlock
    }

    node = forwardTraverse(walker, finishedSubtrees)
  }

  return undefined
}

/**
 * Finds the search space for parameters when using range or prefix match.
 * This is the text from the last block boundary to the end of the range,
 * trimmed to remove any leading/trailing whitespace characters.
 * @return - the text which may be used for constructing a
 *     textEnd parameter identifying this range. Will return undefined if no
 *     block boundaries are found inside this range, or if all the candidate
 *     ranges were empty (or included only whitespace characters).
 */
export function getSearchSpaceForEnd(range: Range): string | undefined {
  let node: Node | null = getLastNodeForBlockSearch(range)
  const walker = makeWalkerForNode(node, range.startContainer)

  if (!walker) {
    return undefined
  }

  const finishedSubtrees = new Set<Node>()
  // If the range ends before the first child of an element node
  // don't visit its subtree because it's not included in the range.
  if (
    range.endContainer.nodeType === Node.ELEMENT_NODE &&
    range.endOffset === 0
  ) {
    finishedSubtrees.add(range.endContainer)
  }
  const origin = node
  const textAccumulator = new BlockTextAccumulator(range, false)

  // tempRange monitors whether we've exhausted our search space yet.
  const tempRange = range.cloneRange()
  while (!tempRange.collapsed && node != null) {
    checkTimeout()
    // Depending on whether |node| is an ancestor of the start of our
    // search, we use either its leading or trailing edge as our end.
    if (node.contains(origin)) {
      tempRange.setEnd(node, 0)
    } else {
      tempRange.setEndAfter(node)
    }

    // Add node to accumulator to keep track of text inside the current block
    // boundaries.
    textAccumulator.appendNode(node)

    // If the accumulator found a non empty block boundary we've got our search
    // space.
    if (textAccumulator.textInBlock !== null) {
      return textAccumulator.textInBlock
    }

    node = backwardTraverse(walker, finishedSubtrees)
  }
  return undefined
}
