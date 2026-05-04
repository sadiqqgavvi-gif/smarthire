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

const isProd = process.env.NODE_ENV === "production";
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

const issueSession = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash: hashToken(refreshToken),
  });

  setAuthCookies(res, accessToken, refreshToken);
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
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, {
        status: 400,
        code: "USER_ALREADY_EXISTS",
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "local",
    });
    await newUser.save();

    await issueSession(res, newUser);

    return sendSuccess(res, {
      message: "Registration successful",
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "AUTH_REGISTER_FAILED",
      message: "Server error",
    });
  }
});

router.post("/login", authLimiter, validateAuthPayload, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return sendError(res, {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found",
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
        message: "Invalid credentials",
      });
    }

    await issueSession(res, user);

    return sendSuccess(res, {
      message: "Login successful",
      user: buildUserResponse(user),
    });
  } catch (error) {
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
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      return sendError(res, {
        status: 500,
        code: "GOOGLE_OAUTH_NOT_CONFIGURED",
        message: "Google sign-in is not configured on the server",
      });
    }

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

    await issueSession(res, user);

    return sendSuccess(res, {
      message: "Google login successful",
      user: buildUserResponse(user),
    });
  } catch (error) {
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
