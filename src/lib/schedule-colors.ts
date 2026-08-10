/** A small, fixed palette so the same subject always gets the same colour everywhere it's shown
 * (admin/teacher editor, parent/student view) — loosely coordinated with the site's own palette
 * (teal/orange/sand/aqua) with a few extra pastel hues added, since a real timetable usually has
 * more distinct subjects than the brand palette has colours for. */
const SUBJECT_PALETTE = [
  '#fdf1a8', // soft yellow
  '#aef2ee', // aqua
  '#f3b9c1', // rose
  '#c9c2f2', // lavender
  '#bfe3c2', // sage
  '#fcd9a8', // apricot
  '#a9d3f2', // sky
  '#e6c8ee', // orchid
  '#d7e39a', // lime
  '#f0c6a8', // clay
];

export function colorForSubject(subject: string): string {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = (hash * 31 + subject.charCodeAt(i)) | 0;
  return SUBJECT_PALETTE[Math.abs(hash) % SUBJECT_PALETTE.length];
}
