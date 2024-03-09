import { checkTimeout, isBlock, isText } from '.'
import { BLOCK_ELEMENTS } from '../constants'

/**
 * Returns all nodes inside root using the provided filter.
 * @yield {HTMLElement} All elements that were accepted by filter.
 */
function* getElementsIn(root: Node, filter: (element: HTMLElement) => number) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode: filter,
    }
  )
  const finishedSubtrees = new Set<Node>()
  while (forwardTraverse(treeWalker, finishedSubtrees) !== null) {
    yield treeWalker.currentNode
  }
}

/**
 * Helper function to calculate the visibility of a Node based on its CSS
 * computed style. This function does not take into account the visibility of
 * the node's ancestors so even if the node is visible according to its style
 * it might not be visible on the page if one of its ancestors is not visible.
 * its computed style meets all of the following criteria:
 *  - non zero height, width, height and opacity
 *  - visibility not hidden
 *  - display not none
 */
export function isNodeVisible(node: Node): boolean {
  // Find an HTMLElement (this node or an ancestor) so we can check
  // visibility.
  let elt: Node | null = node

  while (elt != null && !(elt instanceof HTMLElement)) {
    elt = elt.parentNode
  }

  if (elt != null) {
    const nodeStyle = window.getComputedStyle(elt)
    // If the node is not rendered, just skip it.
    if (
      nodeStyle.visibility === 'hidden' ||
      nodeStyle.display === 'none' ||
      nodeStyle.height === '0' ||
      nodeStyle.width === '0' ||
      nodeStyle.opacity === '0'
    ) {
      return false
    }
  }

  return true
}

/**
 * Helper method to create a TreeWalker useful for finding a block boundary near
 * a given node.
 * @param {Node} node - the node where the search should start
 * @param {Node|Undefined} endNode - optional; if included, the root of the
 *     walker will be chosen to ensure it can traverse at least as far as this
 *     node.
 * @return  a TreeWalker, rooted in a block ancestor of |node|,
 *     currently pointing to |node|, which will traverse only visible text and
 *     element nodes.
 */
export function makeWalkerForNode(node: Node, endNode?: Node): TreeWalker {
  // Find a block-level ancestor of the node by walking up the tree. This
  // will be used as the root of the tree walker.
  let blockAncestor = node
  const endNodeNotNull = endNode != null ? endNode : node

  while (!blockAncestor.contains(endNodeNotNull) || !isBlock(blockAncestor)) {
    if (blockAncestor.parentNode) {
      blockAncestor = blockAncestor.parentNode
    }
  }

  const walker = document.createTreeWalker(
    blockAncestor,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    (node) => {
      return acceptNodeIfVisibleInRange(node)
    }
  )

  walker.currentNode = node
  return walker
}

/**
 * Creates a TreeWalker that traverses a range and emits visible text nodes in
 * the range.
 */
export function makeTextNodeWalker(range: Range): TreeWalker {
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    (node) => {
      return acceptTextNodeIfVisibleInRange(node, range)
    }
  )
  return walker
}

/**
 * Finds the node at which a forward traversal through |range| should begin,
 * based on the range's start container and offset values.
 *
 * For text nodes, this is the start container
 * For element nodes, we use the offset to find the starting point
 */
export function getFirstNodeForBlockSearch(range: Range): Node {
  const node = range.startContainer

  if (
    node.nodeType == Node.ELEMENT_NODE &&
    range.startOffset < node.childNodes.length
  ) {
    return node.childNodes[range.startOffset]
  }

  return node
}

/**
 * Finds the node at which a backward traversal through |range| should begin,
 * based on the range's end container and offset values.
 */
export function getLastNodeForBlockSearch(range: Range): Node {
  // Get a handle on the last node inside the range. For text nodes, this
  // is the end container; for element nodes, we use the offset to find
  // where it actually ends. If the offset is 0, the node itself is returned.
  const node = range.endContainer

  if (range.endContainer.nodeType == Node.ELEMENT_NODE && range.endOffset > 0) {
    return node.childNodes[range.endOffset - 1]
  }

  return node
}

/**
 * Extracts all the text nodes within the given range.
 * @param {Node} root - the root node in which to search
 * @param {Range} range - a range restricting the scope of extraction
 * @return  a list of lists of text nodes, in document order.
 *     Lists represent block boundaries; i.e., two nodes appear in the same list
 *     iff there are no block element starts or ends in between them.
 */
export function getAllTextNodes(root: Node, range: Range): Node[][] {
  const blocks: Node[][] = []
  let tmp: Node[] = []

  const nodes = [
    ...getElementsIn(root, (node) => {
      return acceptNodeIfVisibleInRange(node, range)
    }),
  ]

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      tmp.push(node)
    } else if (
      node instanceof HTMLElement &&
      BLOCK_ELEMENTS.includes(node.tagName) &&
      tmp.length > 0
    ) {
      // If this is a block element, the current set of text nodes in |tmp| is
      // complete, and we need to move on to a new one.
      blocks.push(tmp)
      tmp = []
    }
  }
  if (tmp.length > 0) blocks.push(tmp)
  return blocks
}

/**
 * Finds the first visible text node within a given range
 */
export function getFirstTextNode(range: Range): Node | null {
  // Check if first node in the range is a visible text node.
  const firstNode = getFirstNodeForBlockSearch(range)
  if (isText(firstNode) && isNodeVisible(firstNode)) {
    return firstNode
  }

  // First node is not visible text, use a tree walker to find the first visible
  // text node.
  const walker = makeTextNodeWalker(range)
  walker.currentNode = firstNode
  return walker.nextNode()
}

/**
 * Finds the last visible text node within a given range.
 */
export function getLastTextNode(range: Range): Node | null {
  // Check if last node in the range is a visible text node.
  const lastNode = getLastNodeForBlockSearch(range)
  if (isText(lastNode) && isNodeVisible(lastNode)) {
    return lastNode
  }

  // Last node is not visible text, traverse the range backwards to find the
  // last visible text node.
  const walker = makeTextNodeWalker(range)
  walker.currentNode = lastNode
  return backwardTraverse(walker, new Set())
}

interface TextNodeList {
  preNodes: Node[]
  innerNodes: Node[]
  postNodes: Node[]
}

/**
 * Traverses the DOM to extract all TextNodes appearing in the same block level
 * as |node| (i.e., those that are descendents of a common ancestor of |node|
 * with no other block elements in between.)
 */
export function getTextNodesInSameBlock(node: Node): TextNodeList {
  const preNodes: Node[] = []
  // First, backtraverse to get to a block boundary
  const backWalker = makeWalkerForNode(node)

  const finishedSubtrees = new Set<Node>()
  let backNode = backwardTraverse(backWalker, finishedSubtrees)
  while (backNode != null && !isBlock(backNode)) {
    checkTimeout()

    if (backNode.nodeType === Node.TEXT_NODE) {
      preNodes.push(backNode)
    }

    backNode = backwardTraverse(backWalker, finishedSubtrees)
  }

  preNodes.reverse()

  const innerNodes: Node[] = []
  if (node.nodeType === Node.TEXT_NODE) {
    innerNodes.push(node)
  } else {
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      (node) => {
        return acceptNodeIfVisibleInRange(node)
      }
    )

    walker.currentNode = node

    let child = walker.nextNode()
    while (child != null) {
      checkTimeout()

      if (child.nodeType === Node.TEXT_NODE) {
        innerNodes.push(child)
      }

      child = walker.nextNode()
    }
  }

  const postNodes: Node[] = []
  const forwardWalker = makeWalkerForNode(node)

  // Forward traverse from node after having finished its subtree
  // to get text nodes after it until we find a block boundary.
  const finishedSubtreesForward = new Set([node])
  let forwardNode = forwardTraverse(forwardWalker, finishedSubtreesForward)
  while (forwardNode != null && !isBlock(forwardNode)) {
    checkTimeout()
    if (forwardNode.nodeType === Node.TEXT_NODE) {
      postNodes.push(forwardNode)
    }
    forwardNode = forwardTraverse(forwardWalker, finishedSubtreesForward)
  }

  return {
    preNodes,
    innerNodes,
    postNodes,
  }
}

/**
 * Filter function for use with TreeWalkers. Rejects nodes that aren't in the
 * given range or aren't visible.
 * @return FILTER_ACCEPT or FILTER_REJECT, to be passed along to
 *     a TreeWalker.
 */
export function acceptNodeIfVisibleInRange(node: Node, range?: Range): number {
  if (range != null && !range.intersectsNode(node)) {
    return NodeFilter.FILTER_REJECT
  }

  return isNodeVisible(node)
    ? NodeFilter.FILTER_ACCEPT
    : NodeFilter.FILTER_REJECT
}

/**
 * Filter function for use with TreeWalkers. Accepts only visible text nodes
 * that are in the given range. Other types of nodes visible in the given range
 * are skipped so a TreeWalker using this filter function still visits text
 * nodes in the node's subtree.
 * Values returned:
 *  - FILTER_REJECT: Node not in range or not visible.
 *  - FILTER_SKIP: Non Text Node visible and in range
 *  - FILTER_ACCEPT: Text Node visible and in range
 */
export function acceptTextNodeIfVisibleInRange(
  node: Node,
  range: Range
): number {
  if (range != null && !range.intersectsNode(node))
    return NodeFilter.FILTER_REJECT
  if (!isNodeVisible(node)) {
    return NodeFilter.FILTER_REJECT
  }
  return node.nodeType === Node.TEXT_NODE
    ? NodeFilter.FILTER_ACCEPT
    : NodeFilter.FILTER_SKIP
}

/**
 * Performs traversal on a TreeWalker, visiting each subtree in document order.
 * When visiting a subtree not already visited (its root not in finishedSubtrees
 * ), first the root is emitted then the subtree is traversed, then the root is
 * emitted again and then the next subtree in document order is visited.
 *
 * Subtree's roots are emitted twice to signal the beginning and ending of
 * element nodes. This is useful for ensuring the ends of block boundaries are
 * found.
 */
export function forwardTraverse(
  walker: TreeWalker,
  finishedSubtrees: Set<Node>
): Node | null {
  // If current node's subtree is not already finished
  // try to go first down the subtree.
  if (!finishedSubtrees.has(walker.currentNode)) {
    const firstChild = walker.firstChild()
    if (firstChild) {
      return firstChild
    }
  }

  // If no subtree go to next sibling if any.
  const nextSibling = walker.nextSibling()
  if (nextSibling) {
    return nextSibling
  }

  // If no sibling go back to parent and mark it as finished.
  const parent = walker.parentNode()
  if (parent) {
    finishedSubtrees.add(parent)
  }

  return parent
}

/**
 * Performs backwards traversal on a TreeWalker, visiting each subtree in
 * backwards document order. When visiting a subtree not already visited (its
 * root not in finishedSubtrees ), first the root is emitted then the subtree is
 * backward traversed, then the root is emitted again and then the previous
 * subtree in document order is visited.
 *
 * Subtree's roots are emitted twice to signal the beginning and ending of
 * element nodes. This is useful for ensuring  block boundaries are found.
 */
export function backwardTraverse(
  walker: TreeWalker,
  finishedSubtrees: Set<Node>
): Node | null {
  // If current node's subtree is not already finished
  // try to go first down the subtree.
  if (!finishedSubtrees.has(walker.currentNode)) {
    const lastChild = walker.lastChild()
    if (lastChild) {
      return lastChild
    }
  }

  // If no subtree go to previous sibling if any.
  const previousSibling = walker.previousSibling()
  if (previousSibling) {
    return previousSibling
  }

  // If no sibling go back to parent and mark it as finished.
  const parent = walker.parentNode()
  if (parent) {
    finishedSubtrees.add(parent)
  }

  return parent
}
