chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch(console.error);

// chrome.storage.sync.clear();

chrome.storage.sync.onChanged.addListener((changes) => {
	console.log(changes);
});
