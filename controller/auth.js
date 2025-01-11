import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createError } from "../error.js";
import jwt from "jsonwebtoken";

//SIGNUP
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return next(createError(400, "Missing required fields!"));
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError(409, "Email already in use"));
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Create new user
    const newUser = new User({ ...req.body, password: hash });
    await newUser.save();
    res.status(201).send("User has been created successfully!");
  } catch (err) {
    next(err);
  }
};

//SIGNIN
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(createError(400, "Missing required fields"));
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return next(createError(401, "Invalid credentials"));

    // Verify password
    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) return next(createError(401, "Invalid credentials"));

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT, {
      expiresIn: "1d",
    });
    const { password: _, ...others } = user._doc; // Exclude password

    // Send response with secure cookie
    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json(others);
  } catch (err) {
    next(err);
  }
};

//LOGOUT
export const logout = async (req, res) => {
  try {
    // Clear the token from the cookies
    res
      .clearCookie("access_token")
      .status(200)
      .json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to log out" });
  }
};
