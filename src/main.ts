import './style.scss';
import { getElement, renderNotes } from './utils/';
import { notesState } from './state';

const noteForm = getElement<HTMLFormElement>('#note-form');
const FORM_URL_FIELD = 'h-url';

noteForm.onsubmit = async (e) => {
	e.preventDefault();

	const data = new FormData(noteForm);
	const url = data.get(FORM_URL_FIELD) as string;

	const note = await notesState.noteObjectFromUrl(url);

	if (!note) {
		// getElement(`#note-url-input`).
		return;
	}

	notesState.addNote(note);
	noteForm.hidden = true;
	noteForm.reset();
	renderNotes();
};

renderNotes();
