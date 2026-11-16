import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiResponse.js";

const ACCESS_COOKIE_NAME = "accessToken";

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...valueParts] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(valueParts.join("=") || "");
    return acc;
  }, {});
};

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const cookies = parseCookies(req.headers.cookie || "");
  const cookieToken = cookies[ACCESS_COOKIE_NAME];
  const token = bearerToken || cookieToken;

  if (!token) {
    return sendError(res, {
      status: 401,
      code: "AUTH_TOKEN_MISSING",
      message: "Not authorized, token missing",
    });
  }

  if (!process.env.ACCESS_TOKEN_SECRET && !process.env.JWT_SECRET) {
    return sendError(res, {
      status: 500,
      code: "AUTH_CONFIG_ERROR",
      message: "JWT_SECRET is not configured",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
    );
    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
      permissions: decoded.permissions || [],
    };
    return next();
  } catch {
    return sendError(res, {
      status: 401,
      code: "AUTH_TOKEN_INVALID",
      message: "Not authorized, token invalid",
    });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role || "user";
  if (!allowedRoles.includes(role)) {
    return sendError(res, {
      status: 403,
      code: "FORBIDDEN_ROLE",
      message: "Forbidden: insufficient role",
    });
  }
  return next();
};

export const requirePermission = (...requiredPermissions) => (req, res, next) => {
  const permissions = req.user?.permissions || [];
  const hasAll = requiredPermissions.every((p) => permissions.includes(p));
  if (!hasAll) {
    return sendError(res, {
      status: 403,
      code: "FORBIDDEN_PERMISSION",
      message: "Forbidden: missing permission",
    });
  }
  return next();
};

export default protect;
