const router = require("express").Router();

const  userRoutes  = require("./user.route");
const authenticateUser = require("../middlewares/auth.middleware");

const { currentUser } = require("../controller/decodeToken.controller");
// const  medicineRoutes  = require("./medicine.route");

router.use("/users", userRoutes);

// router.use("/medicines", medicineRoutes);
router.get("/current-user", authenticateUser, currentUser);

module.exports =  router ;
