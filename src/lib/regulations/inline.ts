const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

/** Escapes text, then turns **bold** into <strong>. The only markup a regulations text may hold. */
export function inline(text: string): string {
  const safe = text.replace(/[&<>"]/g, (char) => ESCAPES[char] ?? char);
  return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
}
