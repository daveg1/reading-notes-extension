import { getElement } from '.'
import { notesState } from '../state'
import { renderApp } from './render-app'

const buttonGrouped = getElement<HTMLButtonElement>('#button-grouped')
buttonGrouped.onclick = () => {
  notesState.updateOption('isGrouped', !notesState.options.isGrouped)
  renderApp()
}

function renderGrouped() {
  buttonGrouped.textContent = `[${notesState.options.isGrouped ? 'X' : ' '}] grouped`
}

const buttonSort = getElement<HTMLButtonElement>('#button-sort')
buttonSort.onclick = () => {
  notesState.updateOption('isAsc', !notesState.options.isAsc)
  renderApp()
}

function renderSort() {
  buttonSort.classList[notesState.options.isAsc ? 'add' : 'remove']('asc')
}

export function renderOptions() {
  renderGrouped()
  renderSort()
}
