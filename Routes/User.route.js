import express from "express";
import {
  login,
  signup,
  bookSeats,
  getTrainConfig,
  resetSeats,
} from "../Controller/User.controller.js";
import { isValidToken } from "../Middleware/User.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/train-config", getTrainConfig);

// Protected routes
router.use(isValidToken);
router.post("/book-seats", bookSeats);
router.patch("/reset-seats", resetSeats);

export default router;
