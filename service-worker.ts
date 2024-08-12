import { Message } from './src/interfaces/message'
import { sendMessage } from './src/utils/chrome.util'
import { ActionService } from './src/classes/ActionService'
import { CONTEXT_MENU_ITEM } from './src/constants/context-menu'

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

/**
 * When the sidebar is opened, run all queued actions
 */
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === 'start-up') {
    ActionService.executeQueue()
  }
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab?.id) return
  if (info.menuItemId !== CONTEXT_MENU_ITEM.SAVE_NOTE) return

  await chrome.sidePanel.open({ tabId: tab.id })

  try {
    await sendMessage({ type: 'ping' })
    ActionService.saveNote(tab.id)
  } catch {
    ActionService.push({ type: 'save-note', tabId: tab.id })
  }
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create(
    {
      id: CONTEXT_MENU_ITEM.SAVE_NOTE,
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
