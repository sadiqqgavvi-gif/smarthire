// The server explains client-side problems (answer too long, too many requests) in
// `message`. Those are worth showing as-is; server failures get the page's own wording.
export const getClientErrorMessage = (response, body) => {
  const status = Number(response?.status) || 0;
  if (status < 400 || status >= 500) return "";
  if (status === 429) return "You're sending answers too quickly. Please wait a minute and try again.";
  return typeof body?.message === "string" ? body.message : "";
};
