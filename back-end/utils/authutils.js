const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const generateToken = (user) => {
  const payload = {
    userId: user._id,
    name: user.fullname,
    email: user.email,
    profilePicture: user.profilePicture || {}
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24d",
  });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
};
