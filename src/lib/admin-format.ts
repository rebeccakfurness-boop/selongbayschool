export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Makassar',
  });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Makassar',
  });
}
