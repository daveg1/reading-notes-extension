import { useContext } from 'react'
import { SidebarContext } from '../contexts/SidebarContext'

export function EditingMenu() {
  const { editSelection, cancelEditing, saveAndExitEditing } =
    useContext(SidebarContext)

  return (
    <div className="flex h-7 w-full select-none items-center gap-2">
      <h3 className="flex-grow text-sm">Editing notes</h3>

      <button
        className="h-7 rounded border border-red-300 bg-red-50 px-2 shadow-sm transition-opacity hover:opacity-75 disabled:pointer-events-none disabled:opacity-50"
        onClick={() => saveAndExitEditing()}
        disabled={!editSelection.length}
      >
        Delete{' '}
        <span className="font-mono text-sm">({editSelection.length})</span>
      </button>

      <button
        className="h-7 rounded border border-gray-300 bg-white px-2 shadow-sm transition-opacity hover:opacity-75"
        onClick={() => cancelEditing()}
      >
        Cancel
      </button>
    </div>
  )
}
