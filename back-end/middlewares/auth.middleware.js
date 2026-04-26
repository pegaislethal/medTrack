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

// Authorization middleware for role-based access
const authAdmin = (permissions) => {
  const allowedRoles = Array.isArray(permissions) ? permissions.map(r => r.toLowerCase()) : [permissions.toLowerCase()];
  const Admin = require("../models/admin.model");
  const User = require("../models/user.model");

  return async (req, res, next) => {
    try {
      if (!req.user || (!req.user.userId && !req.user.id)) {
        return res.status(401).json({ success: false, message: "Unauthorized access." });
      }

      const userId = req.user.userId || req.user.id;
      const userRole = (req.user.role || "").toLowerCase();

      // 1. Check if the role in the token matches and is valid in DB
      if (userRole && allowedRoles.includes(userRole)) {
        let userRecord = null;
        
        // Try Admin collection first
        if (userRole === 'admin') {
          userRecord = await Admin.findById(userId);
        } else {
          // Try User collection (Pharmacists)
          userRecord = await User.findById(userId);
        }

        if (userRecord) return next();
      }

      // 2. Fallback: Lookup in both if token info is missing or role changed
      const [adminRecord, pharmacistRecord] = await Promise.all([
        Admin.findById(userId),
        User.findById(userId)
      ]);

      const activeUser = adminRecord || pharmacistRecord;
      if (!activeUser) {
        return res.status(403).json({ success: false, message: "User not found. Access denied." });
      }

      // Pharmacists might not have an explicit role field in DB, assume 'pharmacist' if in User collection
      const effectiveRole = adminRecord ? adminRecord.role : 'pharmacist';
      
      if (allowedRoles.includes(effectiveRole.toLowerCase())) {
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