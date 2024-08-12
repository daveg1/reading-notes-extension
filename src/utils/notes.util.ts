import { Note } from '../interfaces/note'
import { getActiveTab } from './chrome.util'
import { getPageTitleForUrl } from './url.util'

export async function noteObjectFromUrl(
  sourceUrl: string
): Promise<Note | null> {
  const [source, text] = sourceUrl.split(':~:text=')

  if (!source || !text) return null

  const sourceTitle =
    (await getPageTitleForUrl(sourceUrl)) ?? (await getActiveTab()).title ?? ''

  // TODO: parse the text fragment and print a more readable title
  // e.g. when a prefix and suffix is present, strip them to leave the base text
  // e.g. also when there is a start and end text, concat them with '...' in between

  return {
    id: crypto.randomUUID(),
    sourceTitle,
    sourceUrl,
    text: decodeURIComponent(text),
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
