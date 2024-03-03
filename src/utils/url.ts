export function createUrlPattern(fullUrl: string) {
	const url = new URL(fullUrl);
	return `${url.origin}${url.pathname}*`;
}

export function urlsEqual(source: string, target: string) {
	const sourceUrl = new URL(source);
	const targetUrl = new URL(target);

	return (
		`${sourceUrl.origin}${sourceUrl.pathname}` ===
		`${targetUrl.origin}${targetUrl.pathname}`
	);
}

export async function getPageTitleForUrl(sourceUrl: string) {
	const HTML = await fetch(sourceUrl)
		.then(res => res.text())
		.catch(() => null);

	if (!HTML) {
		return null;
	}

	const titleHTML = HTML.match(/<title>.*<\/title>/iu);

	if (!titleHTML) {
		return null;
	}

	const title = titleHTML[0].replace(/<[\/]?title>/giu, '').trim();

	return title ?? null;
}