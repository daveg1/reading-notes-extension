import React, { createContext, useEffect, useState } from 'react'
import { Note } from '../interfaces/note'
import { getStoreValue, setStoreValue } from '../utils'
import { Options } from '../interfaces/options'
import {
  NOTE_STORAGE_KEY,
  OPTIONS_STORAGE_KEY,
} from '../constants/storage-keys'

interface NoteContext {
  // loading state
  isLoading: boolean

  // notes
  notes: Note[]
  addNote(note: Note): void
  removeNote(note: Note): void

  // sorting & grouping options
  isGrouped: boolean
  isAscending: boolean
  updateOptions(options: Options): void
}

export const SidebarContext = createContext<NoteContext>(null!)

export function SidebarContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGrouped, setIsGrouped] = useState(false)
  const [isAscending, setIsAscending] = useState(true)

  useEffect(function loadSyncedState() {
    async function loadStore() {
      const notes: Note[] =
        (await getStoreValue<Note[]>(NOTE_STORAGE_KEY)) ?? []

      const options: Options = (await getStoreValue<Options>(
        OPTIONS_STORAGE_KEY
      )) ?? {
        isGrouped: false,
        isAscending: true,
      }

      setNotes(notes)
      setIsGrouped(options.isGrouped)
      setIsAscending(options.isAscending)
      setIsLoading(false)
    }

    loadStore()
  }, [])

  const addNote = (note: Note) => {
    const newNotes = [...notes, note]
    setNotes(newNotes)
    setStoreValue(NOTE_STORAGE_KEY, newNotes)
  }
  const removeNote = (note: Note) => {
    const index = notes.findIndex((n) => n.id === note.id)
    const newNotes = notes.slice()
    newNotes.splice(index, 1)

    setNotes(newNotes)
    setStoreValue(NOTE_STORAGE_KEY, newNotes)
  }

  const updateOptions = (options: Options) => {
    setIsGrouped(options.isGrouped)
    setIsAscending(options.isAscending)
    setStoreValue(OPTIONS_STORAGE_KEY, options)
  }

  const value: NoteContext = {
    notes,
    isLoading,
    isGrouped,
    isAscending,
    addNote,
    removeNote,
    updateOptions,
  }

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}
