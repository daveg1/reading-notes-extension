/**
 * Useful links
 * https://web.dev/articles/text-fragments
 * https://developer.mozilla.org/en-US/docs/Web/Text_fragments
 *
 * Syntax:
 * #:~:text=[prefix-,]start[,end][,-suffix]
 *
 * Encoded:
 * https://en.wikipedia.org/wiki/Blackletter#:~:text=minuscule%22%20redirects%20here.-,For%20other%20uses,-%2C%20see%20Gothic%20script
 *
 * Decoded:
 * https://en.wikipedia.org/wiki/Blackletter#:~:text=minuscule" redirects here.-,For other uses,-, see Gothic script
 *
 */

function findPrevTextNode(anchorNode: Node) {
  let currNode: Node | null = null
  let textNode: Node | null = null

  while (!textNode) {
    if (anchorNode.previousSibling) {
      // currNode.
    }
  }
  anchorNode.previousSibling
}

async function getTextNodesFor(root: Node) {
  const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

  const textNodes: Node[] = []
  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode
    textNodes.push(node)
  }

  return textNodes
    .map((node) => node.textContent?.trim())
    .filter((node) => !!node)
}

export async function createTextFragment(textSelection) {
  // const textNodes = await getTextNodes()
  const selection = window.getSelection()
  selection?.getRangeAt(0).startContainer
  const prevTextNode = findPrevTextNode(selection?.anchorNode!)

  return textSelection
}
