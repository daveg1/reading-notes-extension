import { useContext } from 'react'
import './NoteList.css'
import { Note } from '../../interfaces/note'
import {
  createUrlPattern,
  getActiveTab,
  getTabWithUrl,
  groupNotes,
  setActiveTab,
  setTabUrl,
  sortNotes,
  urlsEqual,
} from '../../utils'
import { SidebarContext } from '../../contexts/SidebarContext'

export function NoteList() {
  const { notes, removeNote, isGrouped, isAscending } =
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

  const sortedNotes = sortNotes(notes, isAscending)

  return (
    <>
      <div className="note-list">
        {/* <!-- Onclick: scroll to note on page, highlight text (maybe flash text?) --> */}
        {/* <!-- Should contain max of 64 ch --> */}

        {!notes.length && <span>No notes yet. Go add one!</span>}

        {isGrouped &&
          [...groupNotes(sortedNotes)].map(([group, notes], index) => (
            <section key={index} className="note-list">
              <h3>{group}</h3>
              <div className="note-list">
                {notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    hasGroup={true}
                    onOpen={openNote}
                    onDelete={removeNote}
                  />
                ))}
              </div>
            </section>
          ))}

        {!isGrouped && (
          <div className="note-list">
            {sortedNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                hasGroup={false}
                onOpen={openNote}
                onDelete={removeNote}
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
  hasGroup: boolean
  onOpen: (note: Note) => void
  onDelete: (note: Note) => void
}) {
  const { note, hasGroup, onOpen, onDelete } = props

  return (
    <div className="note">
      <a
        className="note__link"
        href={note.sourceUrl}
        target="_blank"
        onClick={(e) => {
          e.preventDefault()
          onOpen(note)
        }}
      >
        {!hasGroup && (
          <span className="note__link__source" title={note.sourceTitle}>
            {note.sourceTitle}
          </span>
        )}

        <span className="note__link__text">{note.text}</span>
      </a>

      <button className="button note__delete" onClick={() => onDelete(note)}>
        ⨯
      </button>
    </div>
  )
}
