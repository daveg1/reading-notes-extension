/**
 * @return  a segmenter object suitable for finding
 *     word boundaries. Returns undefined on browsers/platforms that do not yet
 *     support the Intl.Segmenter API.
 */
export function makeNewSegmenter(): Intl.Segmenter {
  const lang = document.documentElement.lang ?? navigator.languages
  return new Intl.Segmenter(lang, { granularity: 'word' })
}
