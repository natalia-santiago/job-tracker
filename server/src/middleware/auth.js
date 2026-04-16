import jwt from "jsonwebtoken";

/**
 * Auth middleware
 * - Expects: Authorization: Bearer <token>
 * - Attaches: req.user = { id, email }
 */
export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header is required" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization header must use Bearer token format" });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({ error: "Token is missing" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("AUTH MIDDLEWARE ERROR: JWT_SECRET is missing");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email || "",
    };

    next();
  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(401).json({ error: "Unauthorized" });
  }
}