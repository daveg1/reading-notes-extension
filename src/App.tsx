import { useContext } from 'react'
import { ActionsMenu, NoteForm, NoteList } from './components'
import { SidebarContext } from './contexts/SidebarContext'

function App() {
  const { isLoading } = useContext(SidebarContext)

  return (
    <>
      <main className="flex flex-col gap-4 px-3 py-3">
        {isLoading && (
          <>
            <div className="flex items-center gap-3">
              <div className="mr-auto h-7 w-full rounded bg-gray-300"></div>

              <div className="flex gap-2">
                <div className="size-6 min-w-6 rounded bg-gray-300"></div>
                <div className="size-6 min-w-6 rounded bg-gray-300"></div>
              </div>
            </div>

            <hr />

            <div className="flex flex-col gap-2">
              <div className="h-14 w-full rounded bg-gray-300"></div>
              <div className="h-14 w-full rounded bg-gray-300"></div>
              <div className="h-14 w-full rounded bg-gray-300"></div>
            </div>
          </>
        )}

        {!isLoading && (
          <>
            <div className="flex gap-3">
              <NoteForm />
              <ActionsMenu />
            </div>

            <hr />

            <NoteList />
          </>
        )}
      </main>
    </>
  )
}

export default App
