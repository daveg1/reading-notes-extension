import { isBlock, isText } from '../utils'

/**
 * Helper class to calculate visible text from the start or end of a range
 * until a block boundary is reached or the range is exhausted.
 */
export class BlockTextAccumulator {
  textFound = false
  textNodes: Node[] = []
  textInBlock = ''

  /**
   * @param {Range} searchRange - the range for which the text in the last or
   *     first non empty block boundary will be calculated
   * @param {boolean} isForwardTraversal - true if nodes in
   *     searchRange will be forward traversed
   */
  constructor(
    private searchRange: Range,
    private isForwardTraversal: boolean
  ) {}

  /**
   * Adds the next node in the search space range traversal to the accumulator.
   * The accumulator then will keep track of the text nodes in the range until a
   * block boundary is found. Once a block boundary is found and the content of
   * the text nodes in the boundary is non empty, the property textInBlock will
   * be set with the content of the text nodes, trimmed of leading and trailing
   * whitespaces.
   */
  appendNode(node: Node) {
    // If we already calculated the text in the block boundary just ignore any
    // calls to append nodes.
    if (this.textInBlock !== null) return

    // We found a block boundary, check if there's text inside and set it to
    // textInBlock or keep going to the next block boundary.
    if (isBlock(node)) {
      if (this.textFound) {
        // When traversing backwards the nodes are pushed in reverse order.
        // Reversing them to get them in the right order.
        if (!this.isForwardTraversal) {
          this.textNodes.reverse()
        }
        // Concatenate all the text nodes in the block boundary and trim any
        // trailing and leading whitespaces.
        this.textInBlock = this.textNodes
          .map((textNode) => textNode.textContent)
          .join('')
          .trim()
      } else {
        // Discard the text nodes visited so far since they are empty and we'll
        // continue searching in the next block boundary.
        this.textNodes = []
      }
      return
    }

    // Ignore non text nodes.
    if (!isText(node)) return

    // Get the part of node inside the search range. This is to avoid
    // accumulating text that's not inside the range.
    const nodeToInsert = this.getNodeIntersectionWithRange(node)

    // Keep track of any text found in the block boundary.
    this.textFound = this.textFound || nodeToInsert.textContent!.trim() !== ''
    this.textNodes.push(nodeToInsert)
  }

  /**
   * Calculates the intersection of a node with searchRange and returns a Text
   * Node with the intersection
   * @returns node if node is fully within searchRange or a Text Node
   *     with the substring of the content of node inside the search range
   */
  getNodeIntersectionWithRange(node: Node): Node {
    let startOffset = -1
    let endOffset = -1
    if (
      node === this.searchRange.startContainer &&
      this.searchRange.startOffset !== 0
    ) {
      startOffset = this.searchRange.startOffset
    }
    if (
      node === this.searchRange.endContainer &&
      this.searchRange.endOffset !== node.textContent!.length
    ) {
      endOffset = this.searchRange.endOffset
    }
    if (startOffset > -1 || endOffset > -1) {
      return {
        textContent:
          node.textContent?.substring(
            startOffset ?? 0,
            endOffset ?? node.textContent.length
          ) ?? '',
      } as Node
    }
    return node
  }
}
