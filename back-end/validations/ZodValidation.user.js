const z = require("zod");

const signupSchema = z.object({
  fullname: z.string({ required_error: "Name is required" })
    .trim()
    .min(6, { message: "Name must be at least 6 characters" })
    .max(50, { message: "Name must be less than 50 characters" }),

  email: z.string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address" }),

  password: z.string({ required_error: "Password is required" })
    .min(5, { message: "Password must be at least 5 characters long" })   
    .max(15, { message: "Password must be less than 15 characters" })     
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,15}$/,
      { message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" }
    )
});

module.exports = {signupSchema};
