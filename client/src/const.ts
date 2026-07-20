export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Login isn't configured yet (e.g. running outside the Manus ecosystem
  // without OAuth credentials set up). Fail safe instead of throwing and
  // crashing the whole app — every caller of getLoginUrl() treats the
  // result as a plain URL/href, so returning "#" is a safe no-op link.
  if (!oauthPortalUrl || !appId) {
    if (import.meta.env.DEV) {
      console.warn(
        "getLoginUrl(): VITE_OAUTH_PORTAL_URL or VITE_APP_ID is not set. Login is not configured."
      );
    }
    return "#";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const stateData = {
    redirectUri,
    returnPath: returnPath || "/",
  };
  const state = btoa(JSON.stringify(stateData));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
