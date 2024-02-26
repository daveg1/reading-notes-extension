import {
	urlsEqual,
	createUrlPattern,
	getActiveTab,
	getElement,
	getTabWithUrl,
	setActiveTab,
	setTabUrl,
} from '.';
import { notesState } from '../state';

export function renderNotes() {
	const noteList = getElement<HTMLDivElement>('.note-list');
	noteList.innerHTML = '';

	if (!notesState.notes.length) {
		noteList.innerHTML = 'No notes yet.';
	} else {
		const frag = new DocumentFragment();

		notesState.notes.forEach((note) => {
			const div = document.createElement('div');
			div.className = 'note';
			div.id = note.id;

			const anchor = document.createElement('a');
			anchor.className = 'note__link';
			anchor.href = note.sourceUrl;
			anchor.target = '_blank';
			anchor.innerHTML = `
				<span class="note__link__source" title="${note.sourceTitle}">${note.sourceTitle}</span>
				<span class="note__link__text">${note.text}</span>
			`;

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
					console.log('opening...', anchor.href);
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

			div.append(anchor, deleteButton);

			frag.append(div);
		});

		noteList.append(frag);
	}
}
