import { sendMessage } from './src/utils/chrome.util'

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab?.id) return
  if (info.menuItemId !== 'copy-note') return

  sendMessage({ type: 'loading' })
  const response = await chrome.tabs.sendMessage(tab.id!, 'my message')
  sendMessage({ type: 'data', data: response.reply })
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create(
    {
      id: 'copy-note',
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
