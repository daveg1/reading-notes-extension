import { Note } from './interfaces/note';
import { Options } from './interfaces/options';
import { getActiveTab, getPageTitleForUrl, getStoreValue, setStoreValue } from './utils';

const NOTE_STORAGE_KEY = 'notes';
const OPTIONS_STORAGE_KEY = 'notes-options';

class State {
	#notes: Note[];
	#options: Options;

	constructor(notes: Note[], options: Options) {
		this.#notes = notes;
		this.#options = options;
	}

	get options() {
		return this.#options
	}

	updateOption(option: keyof Options, value: boolean) {
		this.#options[option] = value;
		setStoreValue(OPTIONS_STORAGE_KEY, this.#options)
	}
	
	get notes() {
		return this.#notes;
	}

	getGroupedNotes() {
		// create groups
		const groups = new Map<string, Note[]>();
		for (const note of this.#notes) {
			if (groups.has(note.sourceTitle)) {
				groups.get(note.sourceTitle)?.push(note)
			} else {
				groups.set(note.sourceTitle, [note])
			}
		}

		return groups
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

		const sourceTitle = await getPageTitleForUrl(sourceUrl) ?? (await getActiveTab()).title ?? '';

		return {
			id: crypto.randomUUID(),
			sourceTitle,
			sourceUrl,
			text: decodeURIComponent(text),
		};
	}
}

const notesStorage = (await getStoreValue<Note[]>(NOTE_STORAGE_KEY)) ?? [];
const optionsStorage = (await getStoreValue<Options>(OPTIONS_STORAGE_KEY)) ?? { isGrouped: false, isAsc: true }

const notesState = new State(notesStorage, optionsStorage);

export { notesState }