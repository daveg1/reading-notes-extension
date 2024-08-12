import { Note } from '../interfaces/note'
import { getActiveTab } from './chrome.util'
import { getPageTitleForUrl } from './url.util'

function formatFragmentText(fragment: string) {
  // strip prefix
  if (fragment.includes('-,')) {
    fragment = fragment.split('-,')[1]
  }

  // strip suffix
  if (fragment.includes(',-')) {
    fragment = fragment.split(',-')[0]
  }

  // if start and end syntax, insert ellipsis
  if (fragment.includes(',')) {
    const [start, end] = fragment.split(',')
    fragment = `${start} ... ${end}`
  }

  return decodeURIComponent(fragment)
}

// Parse any HTML entities in the source title
function formatSourceTitle(title: string) {
  const doc = new DOMParser().parseFromString(title, 'text/html')
  return doc.documentElement.textContent ?? ''
}

export async function noteObjectFromUrl(
  sourceUrl: string
): Promise<Note | null> {
  const [source, text] = sourceUrl.split(':~:text=')

  if (!source || !text) return null

  const sourceTitle =
    (await getPageTitleForUrl(sourceUrl)) ?? (await getActiveTab()).title ?? ''

  return {
    id: crypto.randomUUID(),
    sourceTitle: formatSourceTitle(sourceTitle),
    sourceUrl,
    text: formatFragmentText(text),
  }
}

export function groupNotes(notes: Note[]) {
  const groups = new Map<string, Note[]>()
  for (const note of notes) {
    if (groups.has(note.sourceTitle)) {
      groups.get(note.sourceTitle)?.push(note)
    } else {
      groups.set(note.sourceTitle, [note])
    }
  }

  return groups
}

export function sortNotes(notes: Note[], isAscending: boolean) {
  return notes.sort((a, b) => {
    const aTitle = a.sourceTitle.toLocaleLowerCase()
    const bTitle = b.sourceTitle.toLocaleLowerCase()

    return (
      (aTitle > bTitle ? 1 : aTitle < bTitle ? -1 : 0) * (isAscending ? 1 : -1)
    )
  })
}
