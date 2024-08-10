import './NoteForm.css'
import { useContext } from 'react'
import { SidebarContext } from '../../contexts/SidebarContext'
import { noteObjectFromUrl } from '../../utils'

export function NoteForm() {
  const { addNote } = useContext(SidebarContext)
  const FORM_URL_FIELD = 'h-url'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.target as HTMLFormElement
    const data = new FormData(form)
    const url = data.get(FORM_URL_FIELD) as string
    const note = await noteObjectFromUrl(url)

    if (!note) {
      return
    }

    addNote(note)
    form.hidden = true
    form.reset()
  }

  return (
    <>
      <form className="form" onSubmit={onSubmit}>
        <input
          id="note-url-input"
          required
          className="form__input"
          name={FORM_URL_FIELD}
          type="text"
          placeholder="Chrome highlight url"
        />
        <button className="button button--text">Save</button>
      </form>
    </>
  )
}
