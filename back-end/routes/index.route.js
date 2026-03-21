const express = require("express");
const router = express.Router();

const userRoutes = require("./user.route");
const adminRoutes = require("./admin.route");
const medicineRoutes = require("./medicine.route");

const { authenticate } = require("../middlewares/auth.middleware");
const { currentUser } = require("../controller/decodeToken.controller");

// MAIN ROUTES
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/medicines", medicineRoutes);

// Get logged-in user
router.get("/current-user", authenticate, currentUser);
router.get("/" ,(req,res)=>{
    res.send("Backend   is running")
}
)

module.exports = router;
