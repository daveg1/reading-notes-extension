import { useContext, useState } from 'react'
import { SidebarContext } from '../contexts/SidebarContext'
import { noteObjectFromUrl } from '../utils'
import clsx from 'clsx'

// TODO: move to action bar

export function NoteForm() {
  const [isSaving, setIsSaving] = useState(false)
  const { addNote } = useContext(SidebarContext)

  const FORM_URL_FIELD = 'h-url'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSaving(true)

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
    setIsSaving(false)
  }

  return (
    <>
      <form className="flex w-full gap-1" onSubmit={onSubmit}>
        <input
          required
          className="h-7 w-full rounded border border-gray-300 px-1 text-xs shadow-sm transition-colors hover:border-gray-500"
          name={FORM_URL_FIELD}
          type="text"
          placeholder="Chrome highlight url"
        />

        <button
          className="relative flex items-center justify-center rounded border border-gray-300 bg-white px-2 shadow-sm transition-opacity hover:opacity-75 disabled:pointer-events-none disabled:opacity-50"
          disabled={isSaving}
        >
          <span className={clsx({ 'opacity-1': isSaving })}>Save</span>
        </button>
      </form>
    </>
  )
}
