import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import { validateAuthPayload } from "../middleware/validationMiddleware.js";

const router = express.Router();

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...valueParts] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(valueParts.join("=") || "");
    return acc;
  }, {});
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const isProd = process.env.NODE_ENV === "production";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: 15 * 60 * 1000,
  path: "/",
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
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
      // Fall through to refresh token check.
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

// Register User
router.post("/register", validateAuthPayload, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email: normalizedEmail, password: hashedPassword });
    await newUser.save();

    const accessToken = signAccessToken(newUser);
    const refreshToken = signRefreshToken(newUser);

    newUser.refreshTokenHash = hashToken(refreshToken);
    await newUser.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login User
router.post("/login", validateAuthPayload, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await User.findByIdAndUpdate(user._id, {
      refreshTokenHash: hashToken(refreshToken),
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Verify token + return current user
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const refreshToken = cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== "refresh") {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id).select(
      "_id email role permissions refreshTokenHash"
    );

    if (!user || !user.refreshTokenHash) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session expired" });
    }

    if (hashToken(refreshToken) !== user.refreshTokenHash) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session invalidated" });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.json({
      message: "Session refreshed",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
      },
    });
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Refresh failed" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const userId = await resolveLogoutUserId(req);

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    }

    clearAuthCookies(res);
    return res.json({ message: "Logged out successfully" });
  } catch {
    clearAuthCookies(res);
    return res.status(500).json({ message: "Logout failed" });
  }
});

export default router;
