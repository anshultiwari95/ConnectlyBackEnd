import express from "express";
import { login, logout, signup } from "../controller/auth.js";

const router = express.Router();

//CREATE A USER
router.post("/signup", signup);

//SIGNIN
router.post("/login", login);

//LOGOUT
router.post("/logout", logout);

export default router;
