import {
  isBlock,
  getLastNodeForBlockSearch,
  makeWalkerForNode,
  makeNewSegmenter,
  checkTimeout,
  forwardTraverse,
  getFirstNodeForBlockSearch,
  getTextNodesInSameBlock,
  getFirstTextNode,
  getLastTextNode,
  makeTextNodeWalker,
  reverseString,
  getAllTextNodes,
  normalizeString,
  getTextContent,
  isWordBounded,
  backwardTraverse,
} from '.'
import { BOUNDARY_CHARS, MAX_EXACT_MATCH_LENGTH } from '../constants'

/**
 * Modifies |range| to start at the next non-whitespace position.
 */
export function advanceRangeStartToNonWhitespace(range: Range) {
  const walker = makeTextNodeWalker(range)
  let node = walker.nextNode()

  while (!range.collapsed && node != null) {
    if (node !== range.startContainer) {
      range.setStart(node, 0)
    }

    if (node.textContent!.length > range.startOffset) {
      const firstChar = node.textContent![range.startOffset]
      if (!firstChar.match(/\s/)) {
        return
      }
    }

    try {
      range.setStart(node, range.startOffset + 1)
    } catch (err) {
      node = walker.nextNode()
      if (node == null) {
        range.collapse()
      } else {
        range.setStart(node, 0)
      }
    }
  }
}

/**
 * Sets the start of |range| to be the first boundary point after |offset| in
 * |node|--either at offset+1, or after the node.
 */
export function advanceRangeStartPastOffset(
  range: Range,
  node: Node,
  offset: number
) {
  try {
    range.setStart(node, offset + 1)
  } catch (err) {
    range.setStartAfter(node)
  }
}

/**
 * Returns a range pointing to the first instance of |query| within |range|.
 */
export function findTextInRange(
  query: string,
  range: Range
): Range | undefined {
  const textNodeLists = getAllTextNodes(range.commonAncestorContainer, range)
  const segmenter = makeNewSegmenter()
  for (const list of textNodeLists) {
    const found = findRangeFromNodeList(query, range, list, segmenter)
    if (found !== undefined) return found
  }
  return undefined
}

/**
 * Modifies the end of the range, if necessary, to ensure the selection text
 * ends before a boundary char (whitespace, etc.) or a block boundary. Can only
 * expand the range, not shrink it.
 * @param range - the range to be modified
 */
export function expandRangeEndToWordBound(range: Range) {
  const segmenter = makeNewSegmenter()

  if (segmenter) {
    // Find the ending text node and offset (since the range may end with a
    // non-text node).
    const endNode = getLastNodeForBlockSearch(range)
    if (endNode !== range.endContainer) {
      range.setEndAfter(endNode)
    }
    expandToNearestWordBoundaryPointUsingSegments(
      segmenter,
      /* expandForward= */ true,
      range
    )
  } else {
    let initialOffset = range.endOffset
    let node = range.endContainer
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (range.endOffset < node.childNodes.length) {
        node = node.childNodes[range.endOffset]
      }
    }
    const walker = makeWalkerForNode(node)
    if (!walker) {
      return
    }
    // We'll traverse the dom after node's subtree to try to find
    // either a word or block boundary.
    const finishedSubtrees = new Set([node])
    while (node != null) {
      checkTimeout()

      const newOffset = findWordEndBoundInTextNode(node, initialOffset)
      // Future iterations should not use initialOffset; null it out so it is
      // discarded.
      initialOffset = null
      if (newOffset !== -1) {
        range.setEnd(node, newOffset)
        return
      }

      // If |node| is a block node, then we've hit a block boundary, which
      // counts as a word boundary.
      if (isBlock(node)) {
        if (node.contains(range.endContainer)) {
          // If the selection starts inside |node|, then the correct range
          // boundary is the *trailing* edge of |node|.
          range.setEnd(node, node.childNodes.length)
        } else {
          // Otherwise, |node| is after the selection, so the correct boundary
          // is the *leading* edge of |node|.
          range.setEndBefore(node)
        }
        return
      }
      node = forwardTraverse(walker, finishedSubtrees)
    }
    // We should never get here; the walker should eventually hit a block node
    // or the root of the document. Collapse range so the caller can handle this
    // as an error.
    range.collapse()
  }
}

/**
 * Determines whether the conditions for an exact match are met.
 */
export function canUseExactMatch(range: Range): boolean {
  if (range.toString().length > MAX_EXACT_MATCH_LENGTH) return false
  return !containsBlockBoundary(range)
}

/**
 * Determines whether or not a range crosses a block boundary.
 */
function containsBlockBoundary(range: Range): boolean {
  const tempRange = range.cloneRange()
  let node: Node | null = getFirstNodeForBlockSearch(tempRange)

  const walker = makeWalkerForNode(node)
  if (!walker) {
    return false
  }

  const finishedSubtrees = new Set<Node>()
  while (!tempRange.collapsed && node != null) {
    if (isBlock(node)) return true
    if (node != null) tempRange.setStartAfter(node)
    node = forwardTraverse(walker, finishedSubtrees)
    checkTimeout()
  }
  return false
}

/**
 * Uses Intl.Segmenter to shift the start or end of a range to a word boundary.
 * Helper method for expandWord*ToWordBound methods.
 */
function expandToNearestWordBoundaryPointUsingSegments(
  segmenter: Intl.Segmenter,
  isRangeEnd: boolean,
  range: Range
): void {
  // Find the index as an offset in the full text of the block in which
  // boundary occurs.
  const boundary = {
    node: isRangeEnd ? range.endContainer : range.startContainer,
    offset: isRangeEnd ? range.endOffset : range.startOffset,
  }

  const nodeList = getTextNodesInSameBlock(boundary.node)
  const preNodeText = nodeList?.preNodes.reduce((prev, cur) => {
    return prev.concat(cur.textContent ?? '')
  }, '')

  const innerNodeText = nodeList?.innerNodes.reduce((prev, cur) => {
    return prev.concat(cur.textContent ?? '')
  }, '')

  let offsetInText = preNodeText?.length ?? 0
  if (boundary.node.nodeType === Node.TEXT_NODE) {
    offsetInText += boundary.offset
  } else if (isRangeEnd) {
    offsetInText += innerNodeText?.length ?? 0
  }

  // Find the segment of the full block text containing the range start.
  const postNodeText = nodeList?.postNodes.reduce((prev, cur) => {
    return prev.concat(cur.textContent ?? '')
  }, '')

  const allNodes = [
    ...(nodeList?.preNodes ?? []),
    ...(nodeList?.innerNodes ?? []),
    ...(nodeList?.postNodes ?? []),
  ]

  // Edge case: There's no text nodes in the block.
  // In that case there's nothing to do because there is no word boundary
  // to find.
  if (allNodes.length == 0) {
    return
  }

  const text = preNodeText?.concat(innerNodeText ?? '', postNodeText ?? '')
  const segments = segmenter.segment(text ?? '')
  const foundSegment = segments.containing(offsetInText)

  if (!foundSegment) {
    if (isRangeEnd) {
      range.setEndAfter(allNodes[allNodes.length - 1])
    } else {
      range.setEndBefore(allNodes[0])
    }
    return
  }

  // Easy case: if the segment is not word-like (i.e., contains whitespace,
  // punctuation, etc.) then nothing needs to be done because this
  // boundary point is between words.
  if (!foundSegment.isWordLike) {
    return
  }

  // Another easy case: if we are at the first/last character of the
  // segment, then we're done.
  if (
    offsetInText === foundSegment.index ||
    offsetInText === foundSegment.index + foundSegment.segment.length
  ) {
    return
  }

  // We're inside a word. Based on |isRangeEnd|, the target offset will
  // either be the start or the end of the found segment.
  const desiredOffsetInText = isRangeEnd
    ? foundSegment.index + foundSegment.segment.length
    : foundSegment.index

  let newNodeIndexInText = 0

  for (const node of allNodes) {
    if (
      newNodeIndexInText <= desiredOffsetInText &&
      desiredOffsetInText < newNodeIndexInText + node.textContent!.length
    ) {
      const offsetInNode = desiredOffsetInText - newNodeIndexInText
      if (isRangeEnd) {
        if (offsetInNode >= node.textContent!.length) {
          range.setEndAfter(node)
        } else {
          range.setEnd(node, offsetInNode)
        }
      } else {
        if (offsetInNode >= node.textContent!.length) {
          range.setStartAfter(node)
        } else {
          range.setStart(node, offsetInNode)
        }
      }
      return
    }

    newNodeIndexInText += node.textContent!.length
  }

  // If we got here, then somehow the offset didn't fall within a node. As a
  // fallback, move the range to the start/end of the block.
  if (isRangeEnd) {
    range.setEndAfter(allNodes[allNodes.length - 1])
  } else {
    range.setStartBefore(allNodes[0])
  }
}

/**
 * Modifies the start of the range, if necessary, to ensure the selection text
 * starts after a boundary char (whitespace, etc.) or a block boundary. Can only
 * expand the range, not shrink it.
 */
export function expandRangeStartToWordBound(range: Range) {
  const segmenter = makeNewSegmenter()
  if (segmenter) {
    // Find the starting text node and offset (since the range may start with a
    // non-text node).
    const startNode = getFirstNodeForBlockSearch(range)
    if (startNode !== range.startContainer) {
      range.setStartBefore(startNode)
    }
    expandToNearestWordBoundaryPointUsingSegments(
      segmenter,
      /* expandForward= */ false,
      range
    )
  } else {
    // Simplest case: If we're in a text node, try to find a boundary char in
    // the same text node.
    const newOffset = findWordStartBoundInTextNode(
      range.startContainer,
      range.startOffset
    )
    if (newOffset !== -1) {
      range.setStart(range.startContainer, newOffset)
      return
    }

    // Also, skip doing any traversal if we're already at the inside edge of
    // a block node.
    if (isBlock(range.startContainer) && range.startOffset === 0) {
      return
    }
    const walker = makeWalkerForNode(range.startContainer)
    if (!walker) {
      return
    }
    const finishedSubtrees = new Set<Node>()
    let node = backwardTraverse(walker, finishedSubtrees)
    while (node != null) {
      const newOffset = findWordStartBoundInTextNode(node)
      if (newOffset !== -1) {
        range.setStart(node, newOffset)
        return
      }

      // If |node| is a block node, then we've hit a block boundary, which
      // counts as a word boundary.
      if (isBlock(node)) {
        if (node.contains(range.startContainer)) {
          // If the selection starts inside |node|, then the correct range
          // boundary is the *leading* edge of |node|.
          range.setStart(node, 0)
        } else {
          // Otherwise, |node| is before the selection, so the correct boundary
          // is the *trailing* edge of |node|.
          range.setStartAfter(node)
        }
        return
      }
      node = internal.backwardTraverse(walker, finishedSubtrees)
      // We should never get here; the walker should eventually hit a block node
      // or the root of the document. Collapse range so the caller can handle
      // this as an error.
      range.collapse()
    }
  }
}

/**
 * Moves the range edges to the first and last visible text nodes inside of it.
 * If there are no visible text nodes in the range then it is collapsed.
 */
export function moveRangeEdgesToTextNodes(range: Range) {
  const firstTextNode = getFirstTextNode(range)
  // No text nodes in range. Collapsing the range and early return.
  if (firstTextNode == null) {
    range.collapse()
    return
  }
  const firstNode = getFirstNodeForBlockSearch(range)

  // Making sure the range starts with visible text.
  if (firstNode !== firstTextNode) {
    range.setStart(firstTextNode, 0)
  }
  const lastNode = getLastNodeForBlockSearch(range)
  const lastTextNode = getLastTextNode(range)!
  // No need for no text node checks here because we know at there's at least
  // firstTextNode in the range.

  // Making sure the range ends with visible text.
  if (lastNode !== lastTextNode) {
    range.setEnd(lastTextNode, lastTextNode.textContent!.length)
  }
}

/**
 * Attempts to find a word start within the given text node, starting at
 * |offset| and working backwards.
 *
 * @param {Node} node - a node to be searched
 * @param {Number|Undefined} startOffset - the character offset within |node|
 *     where the selected text begins. If undefined, the entire node will be
 *     searched.
 * @return {Number} the number indicating the offset to which a range should
 *     be set to ensure it starts on a word bound. Returns -1 if the node is not
 *     a text node, or if no word boundary character could be found.
 */
export function findWordStartBoundInTextNode(
  node: Node,
  startOffset: number
): number {
  if (node.nodeType !== Node.TEXT_NODE) return -1
  const offset = startOffset != null ? startOffset : node.data.length

  // If the first character in the range is a boundary character, we don't
  // need to do anything.
  if (offset < node.data.length && BOUNDARY_CHARS.test(node.data[offset]))
    return offset
  const precedingText = node.data.substring(0, offset)
  const boundaryIndex = reverseString(precedingText).search(BOUNDARY_CHARS)
  if (boundaryIndex !== -1) {
    // Because we did a backwards search, the found index counts backwards
    // from offset, so we subtract to find the start of the word.
    return offset - boundaryIndex
  }
  return -1
}

/**
 * Attempts to find a word end within the given text node, starting at |offset|.
 *
 * @param {Node} node - a node to be searched
 * @param {Number|Undefined} endOffset - the character offset within |node|
 *     where the selected text end. If undefined, the entire node will be
 *     searched.
 * @return {Number} the number indicating the offset to which a range should
 *     be set to ensure it ends on a word bound. Returns -1 if the node is not
 *     a text node, or if no word boundary character could be found.
 */
function findWordEndBoundInTextNode(node: Node, endOffset: number): number {
  if (node.nodeType !== Node.TEXT_NODE) return -1
  const offset = endOffset != null ? endOffset : 0

  // If the last character in the range is a boundary character, we don't
  // need to do anything.
  if (
    offset < node.data.length &&
    offset > 0 &&
    BOUNDARY_CHARS.test(node.data[offset - 1])
  ) {
    return offset
  }
  const followingText = node.data.substring(offset)
  const boundaryIndex = followingText.search(BOUNDARY_CHARS)
  if (boundaryIndex !== -1) {
    return offset + boundaryIndex
  }
  return -1
}

/**
 * Finds a range pointing to the first instance of |query| within |range|,
 * searching over the text contained in a list |nodeList| of relevant textNodes.
 */
function findRangeFromNodeList(
  query: string,
  range: Range,
  textNodes: Node[],
  segmenter: Intl.Segmenter
): Range | undefined {
  if (!query || !range || !(textNodes || []).length) {
    return undefined
  }

  const data = normalizeString(getTextContent(textNodes, 0, undefined))
  const normalizedQuery = normalizeString(query)
  let searchStart =
    textNodes[0] === range.startContainer ? range.startOffset : 0
  let start
  let end

  while (searchStart < data.length) {
    const matchIndex = data.indexOf(normalizedQuery, searchStart)
    if (matchIndex === -1) {
      return undefined
    }

    if (isWordBounded(data, matchIndex, normalizedQuery.length, segmenter)) {
      start = getBoundaryPointAtIndex(matchIndex, textNodes, /* isEnd=*/ false)
      end = getBoundaryPointAtIndex(
        matchIndex + normalizedQuery.length,
        textNodes,
        /* isEnd=*/ true
      )
    }

    if (start != null && end != null) {
      const foundRange = new Range()
      foundRange.setStart(start.node, start.offset)
      foundRange.setEnd(end.node, end.offset)

      // Verify that |foundRange| is a subrange of |range|
      if (
        range.compareBoundaryPoints(Range.START_TO_START, foundRange) <= 0 &&
        range.compareBoundaryPoints(Range.END_TO_END, foundRange) >= 0
      ) {
        return foundRange
      }
    }

    searchStart = matchIndex + 1
  }

  return undefined
}

interface BoundaryPoint {
  node: Node
  offset: number
}

/**
 * Generates a boundary point pointing to the given text position.
 * @param {Number} index - the text offset indicating the start/end of a
 *     substring of the concatenated, normalized text in |textNodes|
 * @param {Node[]} textNodes - the text Nodes whose contents make up the search
 *     space
 * @param {bool} isEnd - indicates whether the offset is the start or end of the
 *     substring
 * @return {BoundaryPoint} - a boundary point suitable for setting as the start
 *     or end of a Range, or undefined if it couldn't be computed.
 */
function getBoundaryPointAtIndex(
  index: number,
  textNodes: Node[],
  isEnd: boolean
): BoundaryPoint {
  let counted = 0
  let normalizedData
  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i]
    if (!normalizedData) normalizedData = normalizeString(node.data)
    let nodeEnd = counted + normalizedData.length
    if (isEnd) nodeEnd += 1
    if (nodeEnd > index) {
      // |index| falls within this node, but we need to turn the offset in the
      // normalized data into an offset in the real node data.
      const normalizedOffset = index - counted
      let denormalizedOffset = Math.min(index - counted, node.data.length)

      // Walk through the string until denormalizedOffset produces a substring
      // that corresponds to the target from the normalized data.
      const targetSubstring = isEnd
        ? normalizedData.substring(0, normalizedOffset)
        : normalizedData.substring(normalizedOffset)
      let candidateSubstring = isEnd
        ? normalizeString(node.data.substring(0, denormalizedOffset))
        : normalizeString(node.data.substring(denormalizedOffset))

      // We will either lengthen or shrink the candidate string to approach the
      // length of the target string. If we're looking for the start, adding 1
      // makes the candidate shorter; if we're looking for the end, it makes the
      // candidate longer.
      const direction =
        (isEnd ? -1 : 1) *
        (targetSubstring.length > candidateSubstring.length ? -1 : 1)
      while (
        denormalizedOffset >= 0 &&
        denormalizedOffset <= node.data.length
      ) {
        if (candidateSubstring.length === targetSubstring.length) {
          return {
            node: node,
            offset: denormalizedOffset,
          }
        }
        denormalizedOffset += direction
        candidateSubstring = isEnd
          ? normalizeString(node.data.substring(0, denormalizedOffset))
          : normalizeString(node.data.substring(denormalizedOffset))
      }
    }
    counted += normalizedData.length
    if (i + 1 < textNodes.length) {
      // Edge case: if this node ends with a whitespace character and the next
      // node starts with one, they'll be double-counted relative to the
      // normalized version. Subtract 1 from |counted| to compensate.
      const nextNormalizedData = normalizeString(textNodes[i + 1].data)
      if (
        normalizedData.slice(-1) === ' ' &&
        nextNormalizedData.slice(0, 1) === ' '
      ) {
        counted -= 1
      }
      // Since we already normalized the next node's data, hold on to it for the
      // next iteration.
      normalizedData = nextNormalizedData
    }
  }
  return undefined
}
