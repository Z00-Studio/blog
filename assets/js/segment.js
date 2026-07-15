/* Sentence segmentation shared by the renderer (app.js) and the validator
   (scripts/validate.mjs). One rule set, so what the validator counts is what
   the page highlights.

   A sentence ends at:
     - CJK terminators 。！？； (plus any closing quotes/brackets), or
     - Latin  terminators . ! ?  (plus closing quotes/brackets) when followed
       by whitespace or end-of-text — so "3.5" or "v1.0" never splits.
   The ellipsis … is NOT a terminator: Chinese prose uses it mid-sentence
   ("…等"), so treating it as an end would split sentences that aren't over.
*/

export const TERMINATOR =
  /[。！？；]+[」』”’）)\]]*|[.!?]+["'”’）)\]]*(?=\s|$)/;

/** Split text into pieces; `end: true` marks a piece that closes a sentence. */
export function splitPieces(text) {
  const out = [];
  let rest = text;
  while (rest.length) {
    const m = rest.match(TERMINATOR);
    if (!m) {
      out.push({ text: rest, end: false });
      break;
    }
    const cut = m.index + m[0].length;
    out.push({ text: rest.slice(0, cut), end: true });
    rest = rest.slice(cut);
  }
  return out;
}

/** Count sentences in a plain-text string (an unterminated tail counts as one). */
export function countSentences(text) {
  const t = text.trim();
  if (!t) return 0;
  const pieces = splitPieces(t);
  let n = pieces.filter((p) => p.end).length;
  const tail = pieces[pieces.length - 1];
  if (tail && !tail.end && tail.text.trim()) n += 1;
  return n;
}
