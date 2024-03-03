import { Note } from './interfaces/note';
import { getActiveTab, getStoreValue, setStoreValue } from './utils';

const NOTE_STORAGE_KEY = 'notes';

class State {
	#notes: Note[];

	constructor(notes: Note[]) {
		this.#notes = notes;
	}

	get notes() {
		return this.#notes;
	}

	async addNote(note: Note) {
		this.#notes.push(note);
		await setStoreValue(NOTE_STORAGE_KEY, this.#notes);
	}

	async removeNote(givenId: string) {
		const index = this.#notes.findIndex((i) => i.id === givenId);
		const newNotes = this.#notes.slice();
		newNotes.splice(index, 1);
		this.#notes = newNotes;
		await setStoreValue(NOTE_STORAGE_KEY, this.#notes);
	}

	async noteObjectFromUrl(sourceUrl: string): Promise<Note | null> {
		const [source, text] = sourceUrl.split(':~:text=');

		if (!source || !text) return null;

		const activeTab = await getActiveTab();

		return {
			id: crypto.randomUUID(),
			sourceTitle: activeTab.title ?? '',
			sourceUrl,
			text: decodeURIComponent(text),
		};
	}
}

const stateFromLoaded = (await getStoreValue<Note[]>(NOTE_STORAGE_KEY)) ?? [];
export const notesState = new State(stateFromLoaded);
