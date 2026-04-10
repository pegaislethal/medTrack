const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // Also set req.userId for backward compatibility
    req.userId = decoded.userId || decoded.id;
    next();
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid token." });
  }
};

// Authorization middleware for admin access
// Usage: authAdmin('admin') or authAdmin(['admin', 'superadmin'])
const authAdmin = (permissions) => {
  // Normalize to array so both authAdmin('admin') and authAdmin(['admin']) work
  const allowedRoles = Array.isArray(permissions) ? permissions : [permissions];

  return async (req, res, next) => {
    try {
      if (!req.user || (!req.user.userId && !req.user.id)) {
        return res.status(401).json({ success: false, message: "Unauthorized access." });
      }

      const userId = req.user.userId || req.user.id;

      // ✅ FIX: Check if the user's role is IN the allowed roles array.
      // Previously: hasPermission(req.user.role, permissions)
      //   → requiredPermissions.includes(adminRole) checked if the *permissions
      //     argument* (a string like 'admin') was inside the *role* string,
      //     which is always wrong.
      // Now: allowedRoles.includes(userRole) — correct direction.
      if (req.user.role && allowedRoles.includes(req.user.role)) {
        const admin = await Admin.findById(userId);
        if (!admin) {
          return res.status(403).json({ success: false, message: "Admin not found." });
        }
        return next();
      }

      // Fall back to DB lookup if role wasn't in the token
      const admin = await Admin.findById(userId);
      if (!admin) {
        return res.status(403).json({ success: false, message: "Admin not found. Access denied." });
      }

      if (allowedRoles.includes(admin.role)) {
        return next();
      } else {
        return res.status(403).json({ success: false, message: "Insufficient privileges." });
      }

    } catch (err) {
      console.error("Error in authAdmin middleware:", err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  };
};

module.exports = { authenticate, authAdmin };