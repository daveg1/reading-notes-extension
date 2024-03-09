import { BLOCK_ELEMENTS } from '../constants'

/**
 * Helper to determine if a node is a block element or not.
 */
export function isBlock(node: Node): boolean {
  const { tagName } = node as HTMLElement
  return node.nodeType === Node.ELEMENT_NODE && BLOCK_ELEMENTS.includes(tagName)
}

/**
 * Helper to determine if a node is a Text Node or not
 */
export function isText(node: Node): boolean {
  return node.nodeType === Node.TEXT_NODE
}
