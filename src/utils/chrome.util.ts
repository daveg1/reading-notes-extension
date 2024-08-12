import { Message } from '../interfaces/message'

export async function getStoreValue<T>(key: string): Promise<T | null> {
  const item = await chrome.storage.sync.get(key)
  return <T>JSON.parse(item[key] ?? null)
}

export async function setStoreValue<T>(key: string, value: T) {
  await chrome.storage.sync.set({
    [key]: JSON.stringify(value),
  })
}

export async function getActiveTab() {
  return (await chrome.tabs.query({ active: true }))[0]
}

export async function getTabWithUrl(url: string) {
  return (await chrome.tabs.query({ url }))[0]
}

export async function setActiveTab(tabId: number) {
  chrome.tabs.update(tabId, { active: true })
}

// TODO: if this works, update above
export async function setTabUrl(tabId: number, url: string) {
  chrome.tabs.update(tabId, { url })
}

/**
 * Sends a message on the chrome runtime
 * @param message
 */
export async function sendMessage(message: Message) {
  chrome.runtime.sendMessage(message)
}
