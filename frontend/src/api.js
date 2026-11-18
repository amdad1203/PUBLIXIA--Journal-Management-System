export async function api(path, options = {}) {
  const form = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(!form ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: options.body
      ? form
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response.");
  }
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}
export const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No deadline";
export const label = (value) =>
  value === 'admin' ? 'Administrator' :
  String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
