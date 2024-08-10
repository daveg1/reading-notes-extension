import { ActionsMenu, NoteForm, NoteList } from './components'

function App() {
  return (
    <>
      <main className="flex flex-col gap-4 px-3 py-3">
        <div className="flex gap-3">
          <NoteForm />
          <ActionsMenu />
        </div>

        <hr />

        <NoteList />
      </main>
    </>
  )
}

export default App
