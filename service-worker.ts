import { createTextFragment } from './utils'

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !info.selectionText) return

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    func: async (selection: string) => {
      await createTextFragment(selection)
    },
    args: [info.selectionText],
  })

  const textFragment = results[0].result
  console.log(info)
  console.log(textFragment)
})

// Add new context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create(
    {
      id: 'selection',
      title: 'Save as reading note',
      contexts: ['selection'],
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(
          'Failed to create contextmenu item: ',
          chrome.runtime.lastError?.message
        )
      }
    }
  )
})
