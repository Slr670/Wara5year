/**
 * Pre-normalize Thai text (U+0E33 ำ -> U+0E4D ํ + U+0E32 า) to eliminate
 * @react-pdf/renderer string length desync bug (#3295) that truncates trailing characters
 */
export function normalizeThai(node) {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node.replace(/\u0E33/g, '\u0E4D\u0E32');
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(normalizeThai);
  return node;
}
