import { Action } from '../interfaces/action'
import { sendMessage } from '../utils'

export const ActionService = new (class ActionService {
  #queue: Action[] = []

  /**
   * Adds an action to the queue
   * @param action
   */
  push(action: Action) {
    this.#queue.push(action)
  }

  /**
   * Executes each item in the queue
   * @returns
   */
  executeQueue() {
    while (this.#queue.length > 0) {
      const action = this.#queue.pop()

      if (!action) return

      switch (action.type) {
        case 'save-note':
          this.saveNote(action.tabId)
      }
    }
  }

  async saveNote(tabId: number) {
    await sendMessage({ type: 'loading' })
    const response = await chrome.tabs.sendMessage(tabId, 'my message')
    sendMessage({ type: 'data', data: response.reply })
  }
})()
