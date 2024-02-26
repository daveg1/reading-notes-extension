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
