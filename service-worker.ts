chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.selectionText) return
  if (info.menuItemId !== 'copy-note') return

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      function run() {
        function textFragmentUtils() {
          const e = [
              'ADDRESS',
              'ARTICLE',
              'ASIDE',
              'BLOCKQUOTE',
              'BR',
              'DETAILS',
              'DIALOG',
              'DD',
              'DIV',
              'DL',
              'DT',
              'FIELDSET',
              'FIGCAPTION',
              'FIGURE',
              'FOOTER',
              'FORM',
              'H1',
              'H2',
              'H3',
              'H4',
              'H5',
              'H6',
              'HEADER',
              'HGROUP',
              'HR',
              'LI',
              'MAIN',
              'NAV',
              'OL',
              'P',
              'PRE',
              'SECTION',
              'TABLE',
              'UL',
              'TR',
              'TH',
              'TD',
              'COLGROUP',
              'COL',
              'CAPTION',
              'THEAD',
              'TBODY',
              'TFOOT',
            ],
            t =
              /[\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u,
            s = { NO_SUFFIX_MATCH: 0, SUFFIX_MATCH: 1, MISPLACED_SUFFIX: 2 },
            n = (e, t, n, r) => {
              const a = r.createRange()
              a.setStart(t.endContainer, t.endOffset),
                a.setEnd(n.endContainer, n.endOffset),
                u(a)
              const i = d(e, a)
              return null == i
                ? s.NO_SUFFIX_MATCH
                : 0 !== i.compareBoundaryPoints(Range.START_TO_START, a)
                  ? s.MISPLACED_SUFFIX
                  : s.SUFFIX_MATCH
            },
            r = (e, t, s) => {
              try {
                e.setStart(t, s + 1)
              } catch (s) {
                e.setStartAfter(t)
              }
            },
            u = (e) => {
              const t = a(e)
              let s = t.nextNode()
              for (; !e.collapsed && null != s; ) {
                if (
                  (s !== e.startContainer && e.setStart(s, 0),
                  s.textContent.length > e.startOffset)
                ) {
                  if (!s.textContent[e.startOffset].match(/\s/)) return
                }
                try {
                  e.setStart(s, e.startOffset + 1)
                } catch (n) {
                  ;(s = t.nextNode()),
                    null == s ? e.collapse() : e.setStart(s, 0)
                }
              }
            },
            a = (e) =>
              document.createTreeWalker(
                e.commonAncestorContainer,
                NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                (t) => o(t, e)
              ),
            i = (e) => {
              let t = e
              for (; null != t && !(t instanceof HTMLElement); )
                t = t.parentNode
              if (null != t) {
                const e = window.getComputedStyle(t)
                if (
                  'hidden' === e.visibility ||
                  'none' === e.display ||
                  0 === e.height ||
                  0 === e.width ||
                  0 === e.opacity
                )
                  return !1
              }
              return !0
            },
            f = (e, t) =>
              (null == t || t.intersectsNode(e)) && i(e)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT,
            o = (e, t) =>
              (null == t || t.intersectsNode(e)) && i(e)
                ? e.nodeType === Node.TEXT_NODE
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_SKIP
                : NodeFilter.FILTER_REJECT,
            c = (t, s) => {
              const n = []
              let r = []
              const u = Array.from(
                (function* (e, t) {
                  const s = document.createTreeWalker(
                      e,
                      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                      { acceptNode: t }
                    ),
                    n = new Set()
                  for (; null !== E(s, n); ) yield s.currentNode
                })(t, (e) => f(e, s))
              )
              for (const t of u)
                t.nodeType === Node.TEXT_NODE
                  ? r.push(t)
                  : t instanceof HTMLElement &&
                    e.includes(t.tagName) &&
                    r.length > 0 &&
                    (n.push(r), (r = []))
              return r.length > 0 && n.push(r), n
            }
          const d = (e, t) => {
              const s = c(t.commonAncestorContainer, t),
                n = F()
              for (const r of s) {
                const s = h(e, t, r, n)
                if (void 0 !== s) return s
              }
            },
            h = (e, t, s, n) => {
              if (!e || !t || !(s || []).length) return
              const r = S(
                  ((e, t, s) => {
                    let n = ''
                    return (
                      (n =
                        1 === e.length
                          ? e[0].textContent.substring(t, s)
                          : e[0].textContent.substring(t) +
                            e
                              .slice(1, -1)
                              .reduce((e, t) => e + t.textContent, '') +
                            e.slice(-1)[0].textContent.substring(0, s)),
                      n.replace(/[\t\n\r ]+/g, ' ')
                    )
                  })(s, 0, void 0)
                ),
                u = S(e)
              let a,
                i,
                f = s[0] === t.startNode ? t.startOffset : 0
              for (; f < r.length; ) {
                const e = r.indexOf(u, f)
                if (-1 === e) return
                if (
                  (D(r, e, u.length, n) &&
                    ((a = l(e, s, !1)), (i = l(e + u.length, s, !0))),
                  null != a && null != i)
                ) {
                  const e = new Range()
                  if (
                    (e.setStart(a.node, a.offset),
                    e.setEnd(i.node, i.offset),
                    t.compareBoundaryPoints(Range.START_TO_START, e) <= 0 &&
                      t.compareBoundaryPoints(Range.END_TO_END, e) >= 0)
                  )
                    return e
                }
                f = e + 1
              }
            },
            l = (e, t, s) => {
              let n,
                r = 0
              for (let u = 0; u < t.length; u++) {
                const a = t[u]
                n || (n = S(a.data))
                let i = r + n.length
                if ((s && (i += 1), i > e)) {
                  const t = e - r
                  let u = Math.min(e - r, a.data.length)
                  const i = s ? n.substring(0, t) : n.substring(t)
                  let f = S(s ? a.data.substring(0, u) : a.data.substring(u))
                  const o = (s ? -1 : 1) * (i.length > f.length ? -1 : 1)
                  for (; u >= 0 && u <= a.data.length; ) {
                    if (f.length === i.length) return { node: a, offset: u }
                    ;(u += o),
                      (f = S(s ? a.data.substring(0, u) : a.data.substring(u)))
                  }
                }
                if (((r += n.length), u + 1 < t.length)) {
                  const e = S(t[u + 1].data)
                  ' ' === n.slice(-1) && ' ' === e.slice(0, 1) && (r -= 1),
                    (n = e)
                }
              }
            },
            D = (e, s, n, r) => {
              if (s < 0 || s >= e.length || n <= 0 || s + n > e.length)
                return !1
              if (r) {
                const t = r.segment(e),
                  u = t.containing(s)
                if (!u) return !1
                if (u.isWordLike && u.index != s) return !1
                const a = s + n,
                  i = t.containing(a)
                if (i && i.isWordLike && i.index != a) return !1
              } else {
                if (e[s].match(t) && (++s, !--n)) return !1
                if (e[s + n - 1].match(t) && !--n) return !1
                if (0 !== s && !e[s - 1].match(t)) return !1
                if (s + n !== e.length && !e[s + n].match(t)) return !1
              }
              return !0
            },
            S = (e) =>
              (e || '')
                .normalize('NFKD')
                .replace(/\s+/g, ' ')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase(),
            F = () => {
              if (Intl.Segmenter) {
                let e = document.documentElement.lang
                return (
                  e || (e = navigator.languages),
                  new Intl.Segmenter(e, { granularity: 'word' })
                )
              }
            },
            E = (e, t) => {
              if (!t.has(e.currentNode)) {
                const t = e.firstChild()
                if (null !== t) return t
              }
              const s = e.nextSibling()
              if (null !== s) return s
              const n = e.parentNode()
              return null !== n && t.add(n), n
            },
            g = {
              BLOCK_ELEMENTS: e,
              BOUNDARY_CHARS: t,
              NON_BOUNDARY_CHARS:
                /[^\t-\r -#%-\*,-\/:;\?@\[-\]_\{\}\x85\xA0\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/u,
              acceptNodeIfVisibleInRange: f,
              normalizeString: S,
              makeNewSegmenter: F,
              forwardTraverse: E,
              backwardTraverse: (e, t) => {
                if (!t.has(e.currentNode)) {
                  const t = e.lastChild()
                  if (null !== t) return t
                }
                const s = e.previousSibling()
                if (null !== s) return s
                const n = e.parentNode()
                return null !== n && t.add(n), n
              },
              makeTextNodeWalker: a,
              isNodeVisible: i,
            }
          'undefined' != typeof goog &&
            goog.declareModuleId(
              'googleChromeLabs.textFragmentPolyfill.textFragmentUtils'
            )
          let A,
            C = 500
          const O = (e) => {
              C = e
            },
            N = {
              SUCCESS: 0,
              INVALID_SELECTION: 1,
              AMBIGUOUS: 2,
              TIMEOUT: 3,
              EXECUTION_FAILED: 4,
            },
            x = (e, t = Date.now()) => m(e, t),
            T = (e, t = Date.now()) => {
              try {
                return B(e, t)
              } catch (e) {
                return e.isTimeout
                  ? { status: N.TIMEOUT }
                  : { status: N.EXECUTION_FAILED }
              }
            },
            p = (e) => {
              if (!e.toString().substring(0, 1e4).match(g.NON_BOUNDARY_CHARS))
                return !1
              try {
                if (e.startContainer.ownerDocument.defaultView !== window.top)
                  return !1
              } catch {
                return !1
              }
              let t = e.commonAncestorContainer,
                s = 0
              for (; t; ) {
                if (t.nodeType == Node.ELEMENT_NODE) {
                  if (['TEXTAREA', 'INPUT'].includes(t.tagName)) return !1
                  const e = t.attributes.getNamedItem('contenteditable')
                  if (e && 'false' !== e.value) return !1
                  if ((s++, s >= 500)) return !1
                }
                t = t.parentNode
              }
              return !0
            },
            m = (e, t) => {
              let s
              try {
                s = e.getRangeAt(0)
              } catch {
                return { status: N.INVALID_SELECTION }
              }
              return B(s, t)
            },
            B = (e, t) => {
              R(t), G(e), q(e)
              const s = e.cloneRange()
              if ((K(e), e.collapsed)) return { status: N.INVALID_SELECTION }
              let n
              if (P(e)) {
                const t = g.normalizeString(e.toString()),
                  s = { textStart: t }
                if (t.length >= 20 && L(s))
                  return { status: N.SUCCESS, fragment: s }
                n = new b().setExactTextMatch(t)
              } else {
                const t = w(e),
                  s = k(e)
                n =
                  t && s
                    ? new b().setStartAndEndSearchSpace(t, s)
                    : new b().setSharedSearchSpace(e.toString().trim())
              }
              const r = document.createRange()
              r.selectNodeContents(document.body)
              const u = r.cloneRange()
              r.setEnd(s.startContainer, s.startOffset),
                u.setStart(s.endContainer, s.endOffset)
              const a = k(r),
                i = w(u)
              ;(a || i) && n.setPrefixAndSuffixSearchSpace(a, i),
                n.useSegmenter(g.makeNewSegmenter())
              let f = !1
              do {
                _(), (f = n.embiggen())
                const e = n.tryToMakeUniqueFragment()
                if (null != e) return { status: N.SUCCESS, fragment: e }
              } while (f)
              return { status: N.AMBIGUOUS }
            },
            _ = () => {
              if (null === C) return
              const e = Date.now() - A
              if (e > C) {
                const t = new Error(
                  `Fragment generation timed out after ${e} ms.`
                )
                throw ((t.isTimeout = !0), t)
              }
            },
            R = (e) => {
              A = e
            },
            w = (e) => {
              let t = H(e)
              const s = V(t, e.endContainer)
              if (!s) return
              const n = new Set()
              e.startContainer.nodeType === Node.ELEMENT_NODE &&
                e.startOffset === e.startContainer.childNodes.length &&
                n.add(e.startContainer)
              const r = t,
                u = new I(e, !0),
                a = e.cloneRange()
              for (; !a.collapsed && null != t; ) {
                if (
                  (_(),
                  t.contains(r) ? a.setStartAfter(t) : a.setStartBefore(t),
                  u.appendNode(t),
                  null !== u.textInBlock)
                )
                  return u.textInBlock
                t = g.forwardTraverse(s, n)
              }
            },
            k = (e) => {
              let t = U(e)
              const s = V(t, e.startContainer)
              if (!s) return
              const n = new Set()
              e.endContainer.nodeType === Node.ELEMENT_NODE &&
                0 === e.endOffset &&
                n.add(e.endContainer)
              const r = t,
                u = new I(e, !1),
                a = e.cloneRange()
              for (; !a.collapsed && null != t; ) {
                if (
                  (_(),
                  t.contains(r) ? a.setEnd(t, 0) : a.setEndAfter(t),
                  u.appendNode(t),
                  null !== u.textInBlock)
                )
                  return u.textInBlock
                t = g.backwardTraverse(s, n)
              }
            },
            b = class {
              constructor() {
                ;(this.Mode = {
                  ALL_PARTS: 1,
                  SHARED_START_AND_END: 2,
                  CONTEXT_ONLY: 3,
                }),
                  (this.startOffset = null),
                  (this.endOffset = null),
                  (this.prefixOffset = null),
                  (this.suffixOffset = null),
                  (this.prefixSearchSpace = ''),
                  (this.backwardsPrefixSearchSpace = ''),
                  (this.suffixSearchSpace = ''),
                  (this.numIterations = 0)
              }
              tryToMakeUniqueFragment() {
                let e
                if (
                  ((e =
                    this.mode === this.Mode.CONTEXT_ONLY
                      ? { textStart: this.exactTextMatch }
                      : {
                          textStart: this.getStartSearchSpace()
                            .substring(0, this.startOffset)
                            .trim(),
                          textEnd: this.getEndSearchSpace()
                            .substring(this.endOffset)
                            .trim(),
                        }),
                  null != this.prefixOffset)
                ) {
                  const t = this.getPrefixSearchSpace()
                    .substring(this.prefixOffset)
                    .trim()
                  t && (e.prefix = t)
                }
                if (null != this.suffixOffset) {
                  const t = this.getSuffixSearchSpace()
                    .substring(0, this.suffixOffset)
                    .trim()
                  t && (e.suffix = t)
                }
                return L(e) ? e : void 0
              }
              embiggen() {
                let e = !0
                if (
                  (this.mode === this.Mode.SHARED_START_AND_END
                    ? this.startOffset >= this.endOffset && (e = !1)
                    : this.mode === this.Mode.ALL_PARTS
                      ? this.startOffset ===
                          this.getStartSearchSpace().length &&
                        this.backwardsEndOffset() ===
                          this.getEndSearchSpace().length &&
                        (e = !1)
                      : this.mode === this.Mode.CONTEXT_ONLY && (e = !1),
                  e)
                ) {
                  const e = this.getNumberOfRangeWordsToAdd()
                  if (this.startOffset < this.getStartSearchSpace().length) {
                    let t = 0
                    if (null != this.getStartSegments())
                      for (
                        ;
                        t < e &&
                        this.startOffset < this.getStartSearchSpace().length;

                      )
                        (this.startOffset = this.getNextOffsetForwards(
                          this.getStartSegments(),
                          this.startOffset,
                          this.getStartSearchSpace()
                        )),
                          t++
                    else {
                      let s = this.startOffset
                      do {
                        _()
                        const e = this.getStartSearchSpace()
                          .substring(this.startOffset + 1)
                          .search(g.BOUNDARY_CHARS)
                        ;(this.startOffset =
                          -1 === e
                            ? this.getStartSearchSpace().length
                            : this.startOffset + 1 + e),
                          -1 !==
                            this.getStartSearchSpace()
                              .substring(s, this.startOffset)
                              .search(g.NON_BOUNDARY_CHARS) &&
                            ((s = this.startOffset), t++)
                      } while (
                        this.startOffset < this.getStartSearchSpace().length &&
                        t < e
                      )
                    }
                    this.mode === this.Mode.SHARED_START_AND_END &&
                      (this.startOffset = Math.min(
                        this.startOffset,
                        this.endOffset
                      ))
                  }
                  if (
                    this.backwardsEndOffset() < this.getEndSearchSpace().length
                  ) {
                    let t = 0
                    if (null != this.getEndSegments())
                      for (; t < e && this.endOffset > 0; )
                        (this.endOffset = this.getNextOffsetBackwards(
                          this.getEndSegments(),
                          this.endOffset
                        )),
                          t++
                    else {
                      let s = this.backwardsEndOffset()
                      do {
                        _()
                        const e = this.getBackwardsEndSearchSpace()
                          .substring(this.backwardsEndOffset() + 1)
                          .search(g.BOUNDARY_CHARS)
                        ;-1 === e
                          ? this.setBackwardsEndOffset(
                              this.getEndSearchSpace().length
                            )
                          : this.setBackwardsEndOffset(
                              this.backwardsEndOffset() + 1 + e
                            ),
                          -1 !==
                            this.getBackwardsEndSearchSpace()
                              .substring(s, this.backwardsEndOffset())
                              .search(g.NON_BOUNDARY_CHARS) &&
                            ((s = this.backwardsEndOffset()), t++)
                      } while (
                        this.backwardsEndOffset() <
                          this.getEndSearchSpace().length &&
                        t < e
                      )
                    }
                    this.mode === this.Mode.SHARED_START_AND_END &&
                      (this.endOffset = Math.max(
                        this.startOffset,
                        this.endOffset
                      ))
                  }
                }
                let t = !1
                if (
                  ((!e ||
                    this.startOffset + this.backwardsEndOffset() < 20 ||
                    this.numIterations >= 1) &&
                    ((null != this.backwardsPrefixOffset() &&
                      this.backwardsPrefixOffset() !==
                        this.getPrefixSearchSpace().length) ||
                      (null != this.suffixOffset &&
                        this.suffixOffset !==
                          this.getSuffixSearchSpace().length)) &&
                    (t = !0),
                  t)
                ) {
                  const e = this.getNumberOfContextWordsToAdd()
                  if (
                    this.backwardsPrefixOffset() <
                    this.getPrefixSearchSpace().length
                  ) {
                    let t = 0
                    if (null != this.getPrefixSegments())
                      for (; t < e && this.prefixOffset > 0; )
                        (this.prefixOffset = this.getNextOffsetBackwards(
                          this.getPrefixSegments(),
                          this.prefixOffset
                        )),
                          t++
                    else {
                      let s = this.backwardsPrefixOffset()
                      do {
                        _()
                        const e = this.getBackwardsPrefixSearchSpace()
                          .substring(this.backwardsPrefixOffset() + 1)
                          .search(g.BOUNDARY_CHARS)
                        ;-1 === e
                          ? this.setBackwardsPrefixOffset(
                              this.getBackwardsPrefixSearchSpace().length
                            )
                          : this.setBackwardsPrefixOffset(
                              this.backwardsPrefixOffset() + 1 + e
                            ),
                          -1 !==
                            this.getBackwardsPrefixSearchSpace()
                              .substring(s, this.backwardsPrefixOffset())
                              .search(g.NON_BOUNDARY_CHARS) &&
                            ((s = this.backwardsPrefixOffset()), t++)
                      } while (
                        this.backwardsPrefixOffset() <
                          this.getPrefixSearchSpace().length &&
                        t < e
                      )
                    }
                  }
                  if (this.suffixOffset < this.getSuffixSearchSpace().length) {
                    let t = 0
                    if (null != this.getSuffixSegments())
                      for (
                        ;
                        t < e &&
                        this.suffixOffset < this.getSuffixSearchSpace().length;

                      )
                        (this.suffixOffset = this.getNextOffsetForwards(
                          this.getSuffixSegments(),
                          this.suffixOffset,
                          this.suffixOffset
                        )),
                          t++
                    else {
                      let s = this.suffixOffset
                      do {
                        _()
                        const e = this.getSuffixSearchSpace()
                          .substring(this.suffixOffset + 1)
                          .search(g.BOUNDARY_CHARS)
                        ;(this.suffixOffset =
                          -1 === e
                            ? this.getSuffixSearchSpace().length
                            : this.suffixOffset + 1 + e),
                          -1 !==
                            this.getSuffixSearchSpace()
                              .substring(s, this.suffixOffset)
                              .search(g.NON_BOUNDARY_CHARS) &&
                            ((s = this.suffixOffset), t++)
                      } while (
                        this.suffixOffset <
                          this.getSuffixSearchSpace().length &&
                        t < e
                      )
                    }
                  }
                }
                return this.numIterations++, e || t
              }
              setStartAndEndSearchSpace(e, t) {
                return (
                  (this.startSearchSpace = e),
                  (this.endSearchSpace = t),
                  (this.backwardsEndSearchSpace = M(t)),
                  (this.startOffset = 0),
                  (this.endOffset = t.length),
                  (this.mode = this.Mode.ALL_PARTS),
                  this
                )
              }
              setSharedSearchSpace(e) {
                return (
                  (this.sharedSearchSpace = e),
                  (this.backwardsSharedSearchSpace = M(e)),
                  (this.startOffset = 0),
                  (this.endOffset = e.length),
                  (this.mode = this.Mode.SHARED_START_AND_END),
                  this
                )
              }
              setExactTextMatch(e) {
                return (
                  (this.exactTextMatch = e),
                  (this.mode = this.Mode.CONTEXT_ONLY),
                  this
                )
              }
              setPrefixAndSuffixSearchSpace(e, t) {
                return (
                  e &&
                    ((this.prefixSearchSpace = e),
                    (this.backwardsPrefixSearchSpace = M(e)),
                    (this.prefixOffset = e.length)),
                  t && ((this.suffixSearchSpace = t), (this.suffixOffset = 0)),
                  this
                )
              }
              useSegmenter(e) {
                return (
                  null == e ||
                    (this.mode === this.Mode.ALL_PARTS
                      ? ((this.startSegments = e.segment(
                          this.startSearchSpace
                        )),
                        (this.endSegments = e.segment(this.endSearchSpace)))
                      : this.mode === this.Mode.SHARED_START_AND_END &&
                        (this.sharedSegments = e.segment(
                          this.sharedSearchSpace
                        )),
                    this.prefixSearchSpace &&
                      (this.prefixSegments = e.segment(this.prefixSearchSpace)),
                    this.suffixSearchSpace &&
                      (this.suffixSegments = e.segment(
                        this.suffixSearchSpace
                      ))),
                  this
                )
              }
              getNumberOfContextWordsToAdd() {
                return 0 === this.backwardsPrefixOffset() &&
                  0 === this.suffixOffset
                  ? 3
                  : 1
              }
              getNumberOfRangeWordsToAdd() {
                return 0 === this.startOffset && 0 === this.backwardsEndOffset()
                  ? 3
                  : 1
              }
              getNextOffsetForwards(e, t, s) {
                let n = e.containing(t)
                for (; null != n; ) {
                  _()
                  const t = n.index + n.segment.length
                  if (n.isWordLike) return t
                  n = e.containing(t)
                }
                return s.length
              }
              getNextOffsetBackwards(e, t) {
                let s = e.containing(t)
                for (
                  (s && t != s.index) || (s = e.containing(t - 1));
                  null != s;

                ) {
                  if ((_(), s.isWordLike)) return s.index
                  s = e.containing(s.index - 1)
                }
                return 0
              }
              getStartSearchSpace() {
                return this.mode === this.Mode.SHARED_START_AND_END
                  ? this.sharedSearchSpace
                  : this.startSearchSpace
              }
              getStartSegments() {
                return this.mode === this.Mode.SHARED_START_AND_END
                  ? this.sharedSegments
                  : this.startSegments
              }
              getEndSearchSpace() {
                return this.mode === this.Mode.SHARED_START_AND_END
                  ? this.sharedSearchSpace
                  : this.endSearchSpace
              }
              getEndSegments() {
                return this.mode === this.Mode.SHARED_START_AND_END
                  ? this.sharedSegments
                  : this.endSegments
              }
              getBackwardsEndSearchSpace() {
                return this.mode === this.Mode.SHARED_START_AND_END
                  ? this.backwardsSharedSearchSpace
                  : this.backwardsEndSearchSpace
              }
              getPrefixSearchSpace() {
                return this.prefixSearchSpace
              }
              getPrefixSegments() {
                return this.prefixSegments
              }
              getBackwardsPrefixSearchSpace() {
                return this.backwardsPrefixSearchSpace
              }
              getSuffixSearchSpace() {
                return this.suffixSearchSpace
              }
              getSuffixSegments() {
                return this.suffixSegments
              }
              backwardsEndOffset() {
                return this.getEndSearchSpace().length - this.endOffset
              }
              setBackwardsEndOffset(e) {
                this.endOffset = this.getEndSearchSpace().length - e
              }
              backwardsPrefixOffset() {
                return null == this.prefixOffset
                  ? null
                  : this.getPrefixSearchSpace().length - this.prefixOffset
              }
              setBackwardsPrefixOffset(e) {
                null != this.prefixOffset &&
                  (this.prefixOffset = this.getPrefixSearchSpace().length - e)
              }
            },
            I = class {
              constructor(e, t) {
                ;(this.searchRange = e),
                  (this.isForwardTraversal = t),
                  (this.textFound = !1),
                  (this.textNodes = []),
                  (this.textInBlock = null)
              }
              appendNode(e) {
                if (null !== this.textInBlock) return
                if (J(e))
                  return void (this.textFound
                    ? (this.isForwardTraversal || this.textNodes.reverse(),
                      (this.textInBlock = this.textNodes
                        .map((e) => e.textContent)
                        .join('')
                        .trim()))
                    : (this.textNodes = []))
                if (!Q(e)) return
                const t = this.getNodeIntersectionWithRange(e)
                ;(this.textFound =
                  this.textFound || '' !== t.textContent.trim()),
                  this.textNodes.push(t)
              }
              getNodeIntersectionWithRange(e) {
                let t = null,
                  s = null
                return (
                  e === this.searchRange.startContainer &&
                    0 !== this.searchRange.startOffset &&
                    (t = this.searchRange.startOffset),
                  e === this.searchRange.endContainer &&
                    this.searchRange.endOffset !== e.textContent.length &&
                    (s = this.searchRange.endOffset),
                  null !== t || null !== s
                    ? {
                        textContent: e.textContent.substring(
                          t ?? 0,
                          s ?? e.textContent.length
                        ),
                      }
                    : e
                )
              }
            },
            L = (e) =>
              1 ===
              ((e, t = document) => {
                const a = [],
                  i = t.createRange()
                for (
                  i.selectNodeContents(t.body);
                  !i.collapsed && a.length < 2;

                ) {
                  let f
                  if (e.prefix) {
                    const s = d(e.prefix, i)
                    if (null == s) break
                    r(i, s.startContainer, s.startOffset)
                    const n = t.createRange()
                    if (
                      (n.setStart(s.endContainer, s.endOffset),
                      n.setEnd(i.endContainer, i.endOffset),
                      u(n),
                      n.collapsed)
                    )
                      break
                    if (((f = d(e.textStart, n)), null == f)) break
                    if (0 !== f.compareBoundaryPoints(Range.START_TO_START, n))
                      continue
                  } else {
                    if (((f = d(e.textStart, i)), null == f)) break
                    r(i, f.startContainer, f.startOffset)
                  }
                  if (e.textEnd) {
                    const u = t.createRange()
                    u.setStart(f.endContainer, f.endOffset),
                      u.setEnd(i.endContainer, i.endOffset)
                    let o = !1
                    for (; !u.collapsed && a.length < 2; ) {
                      const c = d(e.textEnd, u)
                      if (null == c) break
                      if (
                        (r(u, c.startContainer, c.startOffset),
                        f.setEnd(c.endContainer, c.endOffset),
                        e.suffix)
                      ) {
                        const r = n(e.suffix, f, i, t)
                        if (r === s.NO_SUFFIX_MATCH) break
                        if (r === s.SUFFIX_MATCH) {
                          ;(o = !0), a.push(f.cloneRange())
                          continue
                        }
                        if (r === s.MISPLACED_SUFFIX) continue
                      } else (o = !0), a.push(f.cloneRange())
                    }
                    if (!o) break
                  } else if (e.suffix) {
                    const u = n(e.suffix, f, i, t)
                    if (u === s.NO_SUFFIX_MATCH) break
                    if (u === s.SUFFIX_MATCH) {
                      a.push(f.cloneRange()),
                        r(i, i.startContainer, i.startOffset)
                      continue
                    }
                    if (u === s.MISPLACED_SUFFIX) continue
                  } else a.push(f.cloneRange())
                }
                return a
              })(e).length,
            M = (e) => [...(e || '')].reverse().join(''),
            P = (e) => !(e.toString().length > 300) && !X(e),
            H = (e) => {
              let t = e.startContainer
              return (
                t.nodeType == Node.ELEMENT_NODE &&
                  e.startOffset < t.childNodes.length &&
                  (t = t.childNodes[e.startOffset]),
                t
              )
            },
            U = (e) => {
              let t = e.endContainer
              return (
                t.nodeType == Node.ELEMENT_NODE &&
                  e.endOffset > 0 &&
                  (t = t.childNodes[e.endOffset - 1]),
                t
              )
            },
            y = (e) => {
              const t = H(e)
              if (Q(t) && g.isNodeVisible(t)) return t
              const s = g.makeTextNodeWalker(e)
              return (s.currentNode = t), s.nextNode()
            },
            v = (e) => {
              const t = U(e)
              if (Q(t) && g.isNodeVisible(t)) return t
              const s = g.makeTextNodeWalker(e)
              return (s.currentNode = t), g.backwardTraverse(s, new Set())
            },
            X = (e) => {
              const t = e.cloneRange()
              let s = H(t)
              const n = V(s)
              if (!n) return !1
              const r = new Set()
              for (; !t.collapsed && null != s; ) {
                if (J(s)) return !0
                null != s && t.setStartAfter(s),
                  (s = g.forwardTraverse(n, r)),
                  _()
              }
              return !1
            },
            W = (e, t) => {
              if (e.nodeType !== Node.TEXT_NODE) return -1
              const s = null != t ? t : e.data.length
              if (s < e.data.length && g.BOUNDARY_CHARS.test(e.data[s]))
                return s
              const n = e.data.substring(0, s),
                r = M(n).search(g.BOUNDARY_CHARS)
              return -1 !== r ? s - r : -1
            },
            Y = (e, t) => {
              if (e.nodeType !== Node.TEXT_NODE) return -1
              const s = null != t ? t : 0
              if (
                s < e.data.length &&
                s > 0 &&
                g.BOUNDARY_CHARS.test(e.data[s - 1])
              )
                return s
              const n = e.data.substring(s).search(g.BOUNDARY_CHARS)
              return -1 !== n ? s + n : -1
            },
            V = (e, t) => {
              if (!e) return
              let s = e
              const n = null != t ? t : e
              for (; !s.contains(n) || !J(s); )
                s.parentNode && (s = s.parentNode)
              const r = document.createTreeWalker(
                s,
                NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                (e) => g.acceptNodeIfVisibleInRange(e)
              )
              return (r.currentNode = e), r
            },
            G = (e) => {
              const t = g.makeNewSegmenter()
              if (t) {
                const s = H(e)
                s !== e.startContainer && e.setStartBefore(s), z(t, !1, e)
              } else {
                const t = W(e.startContainer, e.startOffset)
                if (-1 !== t) return void e.setStart(e.startContainer, t)
                if (J(e.startContainer) && 0 === e.startOffset) return
                const s = V(e.startContainer)
                if (!s) return
                const n = new Set()
                let r = g.backwardTraverse(s, n)
                for (; null != r; ) {
                  const t = W(r)
                  if (-1 !== t) return void e.setStart(r, t)
                  if (J(r))
                    return void (r.contains(e.startContainer)
                      ? e.setStart(r, 0)
                      : e.setStartAfter(r))
                  ;(r = g.backwardTraverse(s, n)), e.collapse()
                }
              }
            },
            K = (e) => {
              const t = y(e)
              if (null == t) return void e.collapse()
              H(e) !== t && e.setStart(t, 0)
              const s = U(e),
                n = v(e)
              s !== n && e.setEnd(n, n.textContent.length)
            },
            z = (e, t, s) => {
              const n = t
                  ? { node: s.endContainer, offset: s.endOffset }
                  : { node: s.startContainer, offset: s.startOffset },
                r = j(n.node),
                u = r.preNodes.reduce((e, t) => e.concat(t.textContent), ''),
                a = r.innerNodes.reduce((e, t) => e.concat(t.textContent), '')
              let i = u.length
              n.node.nodeType === Node.TEXT_NODE
                ? (i += n.offset)
                : t && (i += a.length)
              const f = r.postNodes.reduce(
                  (e, t) => e.concat(t.textContent),
                  ''
                ),
                o = [...r.preNodes, ...r.innerNodes, ...r.postNodes]
              if (0 == o.length) return
              const c = u.concat(a, f),
                d = e.segment(c).containing(i)
              if (!d)
                return void (t
                  ? s.setEndAfter(o[o.length - 1])
                  : s.setEndBefore(o[0]))
              if (!d.isWordLike) return
              if (i === d.index || i === d.index + d.segment.length) return
              const h = t ? d.index + d.segment.length : d.index
              let l = 0
              for (const e of o) {
                if (l <= h && h < l + e.textContent.length) {
                  const n = h - l
                  return void (t
                    ? n >= e.textContent.length
                      ? s.setEndAfter(e)
                      : s.setEnd(e, n)
                    : n >= e.textContent.length
                      ? s.setStartAfter(e)
                      : s.setStart(e, n))
                }
                l += e.textContent.length
              }
              t ? s.setEndAfter(o[o.length - 1]) : s.setStartBefore(o[0])
            },
            j = (e) => {
              const t = [],
                s = V(e)
              if (!s) return
              const n = new Set()
              let r = g.backwardTraverse(s, n)
              for (; null != r && !J(r); )
                _(),
                  r.nodeType === Node.TEXT_NODE && t.push(r),
                  (r = g.backwardTraverse(s, n))
              t.reverse()
              const u = []
              if (e.nodeType === Node.TEXT_NODE) u.push(e)
              else {
                const t = document.createTreeWalker(
                  e,
                  NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                  (e) => g.acceptNodeIfVisibleInRange(e)
                )
                t.currentNode = e
                let s = t.nextNode()
                for (; null != s; )
                  _(),
                    s.nodeType === Node.TEXT_NODE && u.push(s),
                    (s = t.nextNode())
              }
              const a = [],
                i = V(e)
              if (!i) return
              const f = new Set([e])
              let o = g.forwardTraverse(i, f)
              for (; null != o && !J(o); )
                _(),
                  o.nodeType === Node.TEXT_NODE && a.push(o),
                  (o = g.forwardTraverse(i, f))
              return { preNodes: t, innerNodes: u, postNodes: a }
            },
            q = (e) => {
              const t = g.makeNewSegmenter()
              if (t) {
                const s = U(e)
                s !== e.endContainer && e.setEndAfter(s), z(t, !0, e)
              } else {
                let t = e.endOffset,
                  s = e.endContainer
                s.nodeType === Node.ELEMENT_NODE &&
                  e.endOffset < s.childNodes.length &&
                  (s = s.childNodes[e.endOffset])
                const n = V(s)
                if (!n) return
                const r = new Set([s])
                for (; null != s; ) {
                  _()
                  const u = Y(s, t)
                  if (((t = null), -1 !== u)) return void e.setEnd(s, u)
                  if (J(s))
                    return void (s.contains(e.endContainer)
                      ? e.setEnd(s, s.childNodes.length)
                      : e.setEndBefore(s))
                  s = g.forwardTraverse(n, r)
                }
                e.collapse()
              }
            },
            J = (e) =>
              e.nodeType === Node.ELEMENT_NODE &&
              (g.BLOCK_ELEMENTS.includes(e.tagName) ||
                'HTML' === e.tagName ||
                'BODY' === e.tagName),
            Q = (e) => e.nodeType === Node.TEXT_NODE,
            $ = {
              containsBlockBoundary: X,
              doGenerateFragment: m,
              expandRangeEndToWordBound: q,
              expandRangeStartToWordBound: G,
              findWordEndBoundInTextNode: Y,
              findWordStartBoundInTextNode: W,
              FragmentFactory: b,
              getSearchSpaceForEnd: k,
              getSearchSpaceForStart: w,
              getTextNodesInSameBlock: j,
              recordStartTime: R,
              BlockTextAccumulator: I,
              getFirstTextNode: y,
              getLastTextNode: v,
              moveRangeEdgesToTextNodes: K,
            }
          'undefined' != typeof goog &&
            goog.declareModuleId(
              'googleChromeLabs.textFragmentPolyfill.fragmentGenerationUtils'
            )
          return {
            GenerateFragmentStatus: N,
            forTesting: $,
            generateFragment: x,
            generateFragmentFromRange: T,
            isValidRangeForFragmentGeneration: p,
            setTimeout: O,
          }
        }

        function getFragment() {
          const { generateFragment } = textFragmentUtils()

          const result = generateFragment(window.getSelection())

          if (result.status === 0) {
            const url = `${location.origin}${location.pathname}${location.search}`
            const fragment = (
              result as unknown as {
                fragment: {
                  prefix: string
                  suffix: string
                  textStart: string
                  textEnd: string
                }
              }
            ).fragment

            const prefix = fragment.prefix
              ? `${encodeURIComponent(fragment.prefix)}-,`
              : ''
            const suffix = fragment.suffix
              ? `,-${encodeURIComponent(fragment.suffix)}`
              : ''

            const start = encodeURIComponent(fragment.textStart)
            const end = fragment.textEnd
              ? `,${encodeURIComponent(fragment.textEnd)}`
              : ''

            return url + `#:~:text=${prefix}${start}${end}${suffix}`
          }

          return ''
        }

        const fragment = getFragment()
        console.log(fragment)
      }

      run()
    },
    // world: 'MAIN',
  })
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create(
    {
      id: 'copy-note',
      title: 'Save as reading note',
      contexts: ['selection'],
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(
          'Failed to create contextmenu item: ',
          chrome.runtime.lastError?.message
        )
      }
    }
  )
})
