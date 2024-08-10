import './App.css'
import { Header, NoteForm, NoteList } from './components'

function App() {
  return (
    <>
      <Header />

      <main className="content">
        <NoteForm />
        <NoteList />
      </main>
    </>
  )
}

export default App
