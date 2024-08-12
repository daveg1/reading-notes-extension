export type Action = SaveNoteAction

interface SaveNoteAction {
  type: 'save-note'
  tabId: number
}
