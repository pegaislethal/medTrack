const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const generateToken = (user, role = null) => {
  const payload = {
    userId: user._id || user.userId,
    name: user.fullname || user.name,
    email: user.email,
    profilePicture: user.profilePicture || {},
  };

  // Add role to payload if provided
  if (role) {
    payload.role = role;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24d",
  });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
};
