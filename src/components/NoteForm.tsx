import { useContext } from 'react'
import { SidebarContext } from '../contexts/SidebarContext'
import { noteObjectFromUrl } from '../utils'

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
      <form className="flex w-full gap-1" onSubmit={onSubmit}>
        <input
          required
          className="h-7 w-full rounded border border-gray-300 px-1 text-xs"
          name={FORM_URL_FIELD}
          type="text"
          placeholder="Chrome highlight url"
        />
        <button className="rounded border border-gray-300 bg-white px-2 transition-opacity hover:opacity-75">
          Save
        </button>
      </form>
    </>
  )
}