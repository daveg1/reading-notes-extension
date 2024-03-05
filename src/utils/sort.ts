import { Note } from '../interfaces/note'

export function ascendingPredicate(a: Note, b: Note): number {
  const aTitle = a.sourceTitle.toLocaleLowerCase()
  const bTitle = b.sourceTitle.toLocaleLowerCase()

  return aTitle > bTitle ? 1 : aTitle < bTitle ? -1 : 0
}

export function descendingPredicate(a: Note, b: Note): number {
  const aTitle = a.sourceTitle.toLocaleLowerCase()
  const bTitle = b.sourceTitle.toLocaleLowerCase()

  return aTitle > bTitle ? -1 : aTitle < bTitle ? 1 : 0
}
