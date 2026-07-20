export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Redirects to our own backend, which starts the Google sign-in flow.
// Relative URL — always valid, never throws, no external env var needed
// on the client (unlike the old Manus-portal URL builder).
export const getLoginUrl = (returnPath?: string) => {
  const params = new URLSearchParams({ returnPath: returnPath || "/" });
  return `/api/oauth/google/start?${params.toString()}`;
};
