import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateAuthPayload } from "../middleware/validationMiddleware.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const router = express.Router();

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";
const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...valueParts] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(valueParts.join("=") || "");
    return acc;
  }, {});

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Frontend (Netlify) and backend (Vercel) live on different domains in production,
// so cookies must be SameSite=None; Secure there. Vercel always serves over HTTPS.
const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
const cookieSameSite = isProd ? "none" : "lax";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: cookieSameSite,
  maxAge: 15 * 60 * 1000,
  path: "/",
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: cookieSameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, permissions: user.permissions || [] },
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
};

const buildUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name || "",
  role: user.role,
  permissions: user.permissions || [],
  authProvider: user.authProvider || "local",
});

const isJwtConfigured = () =>
  Boolean(process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET) &&
  Boolean(process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);

const sendJwtConfigError = (res) =>
  sendError(res, {
    status: 500,
    code: "AUTH_CONFIG_ERROR",
    message: "Login is not configured on the server (JWT_SECRET is missing)",
  });

// Issues the session cookies and also returns the access token so the client can
// fall back to an Authorization header when the browser blocks third-party cookies
// (Safari, Brave, Chrome incognito).
const issueSession = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash: hashToken(refreshToken),
  });

  setAuthCookies(res, accessToken, refreshToken);
  return accessToken;
};

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, accessCookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
};

const resolveLogoutUserId = async (req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const accessToken = cookies[ACCESS_COOKIE_NAME];
  const refreshToken = cookies[REFRESH_COOKIE_NAME];

  if (accessToken) {
    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
      );
      if (decoded?.id) return decoded.id;
    } catch {
      // fall through to refresh token
    }
  }

  if (!refreshToken) return null;

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    if (decoded?.type !== "refresh" || !decoded?.id) return null;

    const user = await User.findById(decoded.id).select("_id refreshTokenHash");
    if (!user?.refreshTokenHash) return null;

    if (hashToken(refreshToken) !== user.refreshTokenHash) return null;
    return user._id;
  } catch {
    return null;
  }
};

router.post("/register", authLimiter, validateAuthPayload, async (req, res) => {
  try {
    if (!isJwtConfigured()) return sendJwtConfigError(res);

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const name = typeof req.body.name === "string" ? req.body.name.trim().slice(0, 80) : "";

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const isGoogleOnly = !existingUser.password;
      return sendError(res, {
        status: 400,
        code: isGoogleOnly ? "GOOGLE_ACCOUNT_ONLY" : "USER_ALREADY_EXISTS",
        message: isGoogleOnly
          ? "This email is already registered with Google. Please use \"Continue with Google\"."
          : "An account with this email already exists. Please log in instead.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email: normalizedEmail,
      name,
      password: hashedPassword,
      authProvider: "local",
    });
    await newUser.save();

    const accessToken = await issueSession(res, newUser);

    return sendSuccess(res, {
      message: "Registration successful",
      user: buildUserResponse(newUser),
      accessToken,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, {
        status: 400,
        code: "USER_ALREADY_EXISTS",
        message: "An account with this email already exists. Please log in instead.",
      });
    }
    console.error("Register failed:", error?.message || error);
    return sendError(res, {
      status: 500,
      code: "AUTH_REGISTER_FAILED",
      message: "Server error",
    });
  }
});

router.post("/login", authLimiter, validateAuthPayload, async (req, res) => {
  try {
    if (!isJwtConfigured()) return sendJwtConfigError(res);

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return sendError(res, {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "No account found with this email. Please sign up first.",
      });
    }

    if (!user.password) {
      return sendError(res, {
        status: 400,
        code: "GOOGLE_ACCOUNT_ONLY",
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, {
        status: 400,
        code: "INVALID_CREDENTIALS",
        message: "Incorrect email or password",
      });
    }

    const accessToken = await issueSession(res, user);

    return sendSuccess(res, {
      message: "Login successful",
      user: buildUserResponse(user),
      accessToken,
    });
  } catch (error) {
    console.error("Login failed:", error?.message || error);
    return sendError(res, {
      status: 500,
      code: "AUTH_LOGIN_FAILED",
      message: "Server error",
    });
  }
});

router.post("/google", authLimiter, async (req, res) => {
  try {
    const credential = req.body?.credential || req.body?.idToken;
    const googleClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();

    if (!googleClientId) {
      return sendError(res, {
        status: 500,
        code: "GOOGLE_OAUTH_NOT_CONFIGURED",
        message: "Google sign-in is not configured on the server",
      });
    }

    if (!isJwtConfigured()) return sendJwtConfigError(res);

    if (!credential || typeof credential !== "string") {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Google credential is required",
      });
    }

    const response = await fetch(
      `${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(credential)}`
    );
    const profile = await response.json().catch(() => ({}));

    if (!response.ok) {
      return sendError(res, {
        status: 401,
        code: "GOOGLE_TOKEN_INVALID",
        message: "Google sign-in could not be verified",
      });
    }

    if (profile.aud !== googleClientId || String(profile.email_verified).toLowerCase() !== "true") {
      return sendError(res, {
        status: 401,
        code: "GOOGLE_TOKEN_INVALID",
        message: "Google sign-in could not be verified",
      });
    }

    const normalizedEmail = String(profile.email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return sendError(res, {
        status: 401,
        code: "GOOGLE_TOKEN_INVALID",
        message: "Google account email is missing",
      });
    }

    let user = await User.findOne({ email: normalizedEmail });
    const isNewUser = !user;

    if (!user) {
      user = new User({
        email: normalizedEmail,
        name: profile.name || profile.given_name || "",
        password: null,
        authProvider: "google",
        googleId: profile.sub || null,
        avatarUrl: profile.picture || "",
      });
      await user.save();
    } else {
      user.name = user.name || profile.name || profile.given_name || "";
      user.authProvider = user.authProvider || "google";
      user.googleId = user.googleId || profile.sub || null;
      user.avatarUrl = user.avatarUrl || profile.picture || "";
      await user.save();
    }

    const accessToken = await issueSession(res, user);

    return sendSuccess(res, {
      message: isNewUser
        ? "Your SmartHire account has been created with Google"
        : "Google login successful",
      isNewUser,
      user: buildUserResponse(user),
      accessToken,
    });
  } catch (error) {
    console.error("Google login failed:", error?.message || error);
    return sendError(res, {
      status: 500,
      code: "AUTH_GOOGLE_FAILED",
      message: "Server error",
    });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id email name role permissions authProvider"
    );

    if (!user) {
      return sendError(res, {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    return sendSuccess(res, {
      user: buildUserResponse(user),
    });
  } catch {
    return sendError(res, {
      status: 500,
      code: "AUTH_ME_FAILED",
      message: "Server error",
    });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const refreshToken = cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      clearAuthCookies(res);
      return sendError(res, {
        status: 401,
        code: "REFRESH_TOKEN_MISSING",
        message: "Refresh token missing",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== "refresh") {
      clearAuthCookies(res);
      return sendError(res, {
        status: 401,
        code: "REFRESH_TOKEN_INVALID",
        message: "Invalid refresh token",
      });
    }

    const user = await User.findById(decoded.id).select(
      "_id email name role permissions authProvider refreshTokenHash"
    );

    if (!user || !user.refreshTokenHash) {
      clearAuthCookies(res);
      return sendError(res, {
        status: 401,
        code: "SESSION_EXPIRED",
        message: "Session expired",
      });
    }

    if (hashToken(refreshToken) !== user.refreshTokenHash) {
      clearAuthCookies(res);
      return sendError(res, {
        status: 401,
        code: "SESSION_INVALIDATED",
        message: "Session invalidated",
      });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return sendSuccess(res, {
      message: "Session refreshed",
      user: buildUserResponse(user),
      accessToken: newAccessToken,
    });
  } catch {
    clearAuthCookies(res);
    return sendError(res, {
      status: 401,
      code: "REFRESH_FAILED",
      message: "Refresh failed",
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const userId = await resolveLogoutUserId(req);

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    }

    clearAuthCookies(res);
    return sendSuccess(res, { message: "Logged out successfully" });
  } catch {
    clearAuthCookies(res);
    return sendError(res, {
      status: 500,
      code: "LOGOUT_FAILED",
      message: "Logout failed",
    });
  }
});

export default router;
