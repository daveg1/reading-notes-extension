import { useContext } from 'react'
import { Note } from '../interfaces/note'
import {
  createUrlPattern,
  getActiveTab,
  getTabWithUrl,
  groupNotes,
  setActiveTab,
  setTabUrl,
  sortNotes,
  urlsEqual,
} from '../utils'
import { SidebarContext } from '../contexts/SidebarContext'

export function NoteList() {
  const { notes, isGrouped, isAscending, editSelection } =
    useContext(SidebarContext)

  async function openNote(note: Note) {
    // if we have a tab opened at the target page, set it as active
    const urlPattern = createUrlPattern(note.sourceUrl)
    const tabWithUrl = await getTabWithUrl(urlPattern)

    if (tabWithUrl) {
      await setActiveTab(tabWithUrl.id!)
    }

    // if we are on the correct tab, navigate to the target note
    const activeTab = await getActiveTab()
    if (urlsEqual(note.sourceUrl, activeTab.url ?? '')) {
      const currentUrl = new URL(note.sourceUrl)
      await setTabUrl(activeTab.id!, currentUrl.href)

      // Jump to new hash (i.e. another note on same page)
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id! },
        func: function (hash: string) {
          window.location.hash = hash
        },
        args: [currentUrl.hash],
      })
    } else {
      window.open(note.sourceUrl)
    }
  }

  const isInSelection = (note: Note) =>
    !!editSelection.find((n) => n.id === note.id)

  const sortedNotes = sortNotes(notes, isAscending)

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* <!-- Onclick: scroll to note on page, highlight text (maybe flash text?) --> */}
        {/* <!-- Should contain max of 64 ch --> */}

        {!notes.length && <span>No notes yet. Go add one!</span>}

        {isGrouped &&
          [...groupNotes(sortedNotes)].map(([group, notes], index) => (
            <section
              key={index}
              className="flex flex-col gap-2 [&:not(:first-child)]:pt-2"
            >
              <h3 className="text-sm font-medium">{group}</h3>
              <div className="flex flex-col gap-2">
                {notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    isSelected={isInSelection(note)}
                    onOpen={openNote}
                  />
                ))}
              </div>
            </section>
          ))}

        {!isGrouped && (
          <div className="flex flex-col gap-2">
            {sortedNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={isInSelection(note)}
                onOpen={openNote}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function NoteItem(props: {
  note: Note
  isSelected: boolean
  onOpen: (note: Note) => void
}) {
  const { note, isSelected, onOpen } = props
  const { isEditing, toggleFromEditSelection } = useContext(SidebarContext)

  return (
    <a
      className="flex cursor-pointer select-none items-center gap-2 rounded bg-white p-2 shadow-sm hover:bg-gray-300"
      href={!isEditing ? note.sourceUrl : undefined}
      target="_blank"
      onClick={(e) => {
        e.preventDefault()

        if (isEditing) {
          toggleFromEditSelection(note)
        } else {
          onOpen(note)
        }
      }}
    >
      {isEditing && (
        <div className="grid size-4 shrink-0 place-content-center rounded border border-current text-gray-500">
          {isSelected && <div className="size-2 rounded-sm bg-current"></div>}
        </div>
      )}

      <div className="flex min-w-0 flex-grow flex-col gap-1">
        <span className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-sm">
          {note.text}
        </span>

        <span
          className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-xs opacity-75"
          title={note.sourceUrl}
        >
          {note.sourceUrl}
        </span>
      </div>
    </a>
  )
}
