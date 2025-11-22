require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const mainRouter = require("./routes/index.route");
const { swaggerUi, swaggerSpec } = require("./config/swagger");
// Initialize Cloudinary configuration
require("./config/cloudinary");

// const session = require("express-session");
// const passport = require("passport");
const cors = require("cors");

const app = express();

connectDB();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "https://financefusion-six.vercel.app",
    ],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", mainRouter);
app.get("/", (req, res) => {
  res.send("MedTrack App");
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
