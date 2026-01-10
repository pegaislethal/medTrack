require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const mainRouter = require("./routes/index.route");
const { swaggerUi, swaggerSpec } = require("./config/swagger");
require("./config/cloudinary");
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
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", mainRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
