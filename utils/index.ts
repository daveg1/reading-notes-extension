/**
 * Useful links
 * https://web.dev/articles/text-fragments
 * https://developer.mozilla.org/en-US/docs/Web/Text_fragments
 * https://gist.github.com/devjin0617/3e8d72d94c1b9e69690717a219644c7a
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

function getTextNodesFor(root: Node) {
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

export function createTextFragment(textSelection) {
  function getSelection() {
    const selection = window.getSelection()
    selection?.getRangeAt(0).startContainer
    return selection
  }

  function getTextNodesFor(root: Node) {
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

  const textNodes = getTextNodesFor(document.body)
  const selection = getSelection()
  console.log(textNodes)
  console.log(selection)

  // const prevTextNode = findPrevTextNode(selection?.anchorNode!)

  return textSelection
}
