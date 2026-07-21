import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import axios from "axios";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

// Constant local app identifier stored in our own session JWTs. Decoupled
// on purpose from Manus's VITE_APP_ID (which is intentionally left unset in
// this deployment) — the session JWT's own verifySession() check requires a
// non-empty appId field, so this just needs to be *some* stable string, not
// a value shared with any external system.
const LOCAL_APP_ID = "onlyfangs";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getGoogleRedirectUri(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.get("host");
  return `${proto}://${host}/api/oauth/google/callback`;
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/oauth/google/start", async (req: Request, res: Response) => {
    const returnPath = getQueryParam(req, "returnPath") || "/";

    if (!ENV.googleClientId) {
      console.log("[Google OAuth] GOOGLE_CLIENT_ID is not set. Bypassing login with developer/mock user.");
      const openId = "google:developer_bypass_user";
      try {
        await db.upsertUser({
          openId,
          name: "Mortal Iniciado",
          email: "mortal@onlyfangs.com",
          loginMethod: "google",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.signSession(
          { openId, appId: LOCAL_APP_ID, name: "Mortal Iniciado" },
          { expiresInMs: ONE_YEAR_MS }
        );

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, returnPath);
      } catch (error) {
        console.error("[Google OAuth] Bypass login failed", error);
        res.status(500).send("Bypass login failed: " + String(error));
      }
      return;
    }

    const state = Buffer.from(JSON.stringify({ returnPath })).toString("base64url");

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: getGoogleRedirectUri(req),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });

    res.redirect(302, `${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).send("Missing authorization code from Google.");
      return;
    }

    let returnPath = "/";
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
        if (typeof decoded.returnPath === "string") returnPath = decoded.returnPath;
      } catch {
        // Malformed/tampered state — fall back to the home page instead of failing.
      }
    }

    try {
      const tokenResponse = await axios.post(
        GOOGLE_TOKEN_URL,
        new URLSearchParams({
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: getGoogleRedirectUri(req),
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const accessToken = tokenResponse.data?.access_token as string | undefined;
      if (!accessToken) {
        throw new Error("Google did not return an access_token");
      }

      const userInfoResponse = await axios.get(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const googleUser = userInfoResponse.data as {
        sub: string;
        name?: string;
        email?: string;
      };

      if (!googleUser.sub) {
        throw new Error("Google user info is missing 'sub' (user id)");
      }

      // Namespaced so it can never collide with an openId issued by the old
      // Manus OAuth flow, should any legacy rows still exist in the DB.
      const openId = `google:${googleUser.sub}`;

      await db.upsertUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.signSession(
        { openId, appId: LOCAL_APP_ID, name: googleUser.name || "" },
        { expiresInMs: ONE_YEAR_MS }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, returnPath || "/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).send("Google sign-in failed. Please try again.");
    }
  });
}
