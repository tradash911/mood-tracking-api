import express from "express";

import { allMood, createMood, editMood } from "../controller/moodController.js";
import { protect, restrictTo } from "../controller/authController.js";

const router = express.Router();

router
  .route("/")
  .get(protect, restrictTo("admin"), allMood)
  .post(protect, createMood);
router.route("/editMood/:id").patch(protect, editMood);

export default router;
