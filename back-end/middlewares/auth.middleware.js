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
const authAdmin = (permissions) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated and has userId
      if (!req.user || (!req.user.userId && !req.user.id)) {
        return res.status(401).json({ success: false, message: "Unauthorized access." });
      }

      // Get userId from token (could be userId or id)
      const userId = req.user.userId || req.user.id;

      // First check if role is in token (faster check)
      if (req.user.role && hasPermission(req.user.role, permissions)) {
        // Verify admin exists in database
        const admin = await Admin.findById(userId);
        if (!admin) {
          return res.status(403).json({ success: false, message: "Admin not found." });
        }
        return next();
      }

      // If no role in token, check database
      const admin = await Admin.findById(userId);
      if (!admin) {
        return res.status(403).json({ success: false, message: "Admin not found. Access denied." });
      }

      if (hasPermission(admin.role, permissions)) {
        return next();  // Proceed if permission check passes
      } else {
        return res.status(403).json({ success: false, message: "Insufficient privileges." });
      }

    } catch (err) {
      console.error("Error in authAdmin middleware:", err); // Log the error for debugging
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  };
};

const hasPermission = (adminRole, requiredPermissions) => {
  return requiredPermissions.includes(adminRole);
};

module.exports = { authenticate, authAdmin };
