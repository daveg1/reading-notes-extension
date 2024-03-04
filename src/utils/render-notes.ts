import {
	urlsEqual,
	createUrlPattern,
	getActiveTab,
	getElement,
	getTabWithUrl,
	setActiveTab,
	setTabUrl,
} from '.';
import { Note } from '../interfaces/note';
import { notesState } from '../state';

export function renderNotes() {
	const noteList = getElement<HTMLDivElement>('.note-list');
	noteList.innerHTML = '';

	if (!notesState.getNotes()?.length) {
		noteList.innerHTML = 'No notes yet.';
	} else {
		const groups = notesState.getGroupedNotes();

		// Groups
		const fragment = new DocumentFragment();

		for (const [title, notes] of groups.entries()) {
			const groupHTML = createGroupHTML(title);
			const notesFragment = createNotes(notes, true);
			groupHTML.lastElementChild?.append(notesFragment)
			fragment.append(groupHTML);
		}

		noteList.append(fragment);

		// if ungrouped:
		// const notesFragment = createNotes(notesOrGroups);
		// noteList.append(notesFragment);
	}
}

function createNotes(notes: Note[], hasSection = false) {
	const frag = new DocumentFragment();
	notes.forEach(note => {
		const nodeDiv = createNoteHTML(note, hasSection)
		frag.append(nodeDiv);
	})

	return frag;
}

function createGroupHTML(groupName: string, ) {
	const groupHTML = document.createElement('section')
	groupHTML.className = 'note-list';

	const h3 = document.createElement('h3')
	h3.textContent = groupName;

	const noteList = document.createElement('div')
	noteList.className = 'note-list'


	groupHTML.append(h3, noteList)
	return groupHTML
}

function createNoteHTML(note: Note, hasSection = false) {
	const noteDiv = document.createElement('div');
	noteDiv.className = 'note';
	noteDiv.id = note.id;

	const anchor = document.createElement('a');
	anchor.className = 'note__link';
	anchor.href = note.sourceUrl;
	anchor.target = '_blank';

	if (!hasSection) {
		anchor.innerHTML += `<span class="note__link__source" title="${note.sourceTitle}">${note.sourceTitle}</span>`
	}

	anchor.innerHTML += `<span class="note__link__text">${note.text}</span>`;

	// Prevent navigating if we're already on the page
	anchor.onclick = async (e) => {
		e.preventDefault();

		// if we have a tab opened at the target page, set it as active
		const urlPattern = createUrlPattern(anchor.href);
		const tabWithUrl = await getTabWithUrl(urlPattern);

		if (tabWithUrl) {
			await setActiveTab(tabWithUrl.id!);
		}

		// if we are on the correct tab, navigate to the target note
		const activeTab = await getActiveTab();
		if (urlsEqual(anchor.href, activeTab.url ?? '')) {
			const currentUrl = new URL(anchor.href);
			await setTabUrl(activeTab.id!, currentUrl.href);

			// Jump to new hash (i.e. another note on same page)
			chrome.scripting.executeScript({
				target: { tabId: activeTab.id! },
				func: function (hash: string) {
					window.location.hash = hash;
				},
				args: [currentUrl.hash],
			});
		} else {
			window.open(anchor.href);
		}
	};

	const deleteButton = document.createElement('button');
	deleteButton.className = 'button note__delete';
	deleteButton.tabIndex = -1;
	deleteButton.textContent = '⨯';
	deleteButton.onclick = async () => {
		await notesState.removeNote(note.id);
		renderNotes();
	};

	noteDiv.append(anchor, deleteButton);

	return noteDiv;
}