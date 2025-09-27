// Convert Date or ISO string -> "YYYY-MM-DDTHH:mm" (for <input type="datetime-local">)
export function toInputDateTime(value: string | Date): string {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

// Convert "YYYY-MM-DDTHH:mm" (from input) -> ISO string
export function fromInputDateTime(value: string): string {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}