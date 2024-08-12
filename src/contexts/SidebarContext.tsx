import React, { createContext, useCallback, useEffect, useState } from 'react'
import { Note } from '../interfaces/note'
import { getStoreValue, noteObjectFromUrl, setStoreValue } from '../utils'
import { Options } from '../interfaces/options'
import {
  NOTE_STORAGE_KEY,
  OPTIONS_STORAGE_KEY,
} from '../constants/storage-keys'
import { Message } from '../interfaces/message'

interface NoteContext {
  // loading state
  isLoading: boolean

  // notes
  notes: Note[]
  addNote(note: Note): void
  removeNote(note: Note): void

  // editing notes
  isEditing: boolean
  startEditing: () => void
  saveAndExitEditing: () => void
  cancelEditing: () => void
  editSelection: Note[]
  setEditSelection: React.Dispatch<React.SetStateAction<Note[]>>
  toggleFromEditSelection(note: Note): void

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
  const [isEditing, setIsEditing] = useState(false)
  const [editSelection, setEditSelection] = useState<Note[]>([])
  const [isGrouped, setIsGrouped] = useState(false)
  const [isAscending, setIsAscending] = useState(true)

  useEffect(function loadSyncedState() {
    async function loadStore() {
      console.log('loading store....')

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

  useEffect(
    function listenToMessages() {
      const messageListener = async (message: Message) => {
        if (message.type === 'loading') {
          setIsLoading(true)
        }

        if (message.type === 'data') {
          const newNote = await noteObjectFromUrl(message.data)
          if (newNote) addNote(newNote)
          setIsLoading(false)
        }
      }

      chrome.runtime.onMessage.addListener(messageListener)

      return () => {
        chrome.runtime.onMessage.removeListener(messageListener)
      }
    },
    [notes]
  )

  // Notes
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
  const removeNotesBulk = (notes: Note[]) => {
    const newNotes = notes.slice()

    for (const note of notes) {
      const index = newNotes.findIndex((n) => n.id === note.id)
      newNotes.splice(index, 1)
    }

    console.log(notes, newNotes)

    setNotes(newNotes)
    setStoreValue(NOTE_STORAGE_KEY, newNotes)
  }

  // Options
  const updateOptions = (options: Options) => {
    setIsGrouped(options.isGrouped)
    setIsAscending(options.isAscending)
    setStoreValue(OPTIONS_STORAGE_KEY, options)
  }

  // Editing
  const startEditing = () => {
    setIsEditing(true)
    setEditSelection([])
  }

  const saveAndExitEditing = () => {
    removeNotesBulk(editSelection)
    setIsEditing(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const toggleFromEditSelection = (note: Note) => {
    const index = editSelection.findIndex((n) => n.id === note.id)

    if (index === -1) {
      setEditSelection((sel) => [...sel, note])
    } else {
      setEditSelection((sel) => {
        const newNotes = sel.slice()
        newNotes.splice(index, 1)
        return newNotes
      })
    }
  }

  const value: NoteContext = {
    notes,
    isLoading,
    isGrouped,
    isEditing,
    isAscending,
    editSelection,
    addNote,
    removeNote,
    startEditing,
    saveAndExitEditing,
    cancelEditing,
    updateOptions,
    setEditSelection,
    toggleFromEditSelection,
  }

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}
