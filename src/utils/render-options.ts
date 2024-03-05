import { getElement } from ".";
import { notesState } from "../state";
import { renderApp } from "./render-app";

const buttonGrouped = getElement<HTMLButtonElement>('#button-grouped')
buttonGrouped.onclick = () => {
	notesState.updateOption('isGrouped', !notesState.options.isGrouped);
	buttonGrouped.textContent = `[${notesState.options.isGrouped ? 'X' : ' ' }] grouped`
  renderApp();
}

export function renderOptions() {
	buttonGrouped.textContent = `[${notesState.options.isGrouped ? 'X' : ' ' }] grouped`
}