import { getStoreValue, noteObjectFromUrl, setStoreValue } from './src/utils'
import { NOTE_STORAGE_KEY } from './src/constants/storage-keys'
import { Note } from './src/interfaces/note'

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab?.id) return
  if (info.menuItemId !== 'copy-note') return

  const response = await chrome.tabs.sendMessage(tab.id!, 'my message')
  const newNote = await noteObjectFromUrl(`${response.reply}`)

  // TODO: signal to sidebar to update UI
  const currentNotes = (await getStoreValue<Note[]>(NOTE_STORAGE_KEY)) ?? []
  setStoreValue(NOTE_STORAGE_KEY, [...currentNotes, newNote])
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
