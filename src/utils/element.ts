export function getElement<T extends HTMLElement>(selector: string) {
	return document.querySelector(selector) as T;
}
