export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Makassar',
  });
}

/** For date-only values (e.g. a DATE column), formatted without a timezone conversion that could shift the day. */
export function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
