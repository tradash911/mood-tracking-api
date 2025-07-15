import express from "express";
import {
  createUser,
  deleteMe,
  deleteUser,
  editUser,
  getAllUser,
  getMe,
  getMyMoods,
  updateAvatar,
  updateMe,
} from "../controller/userController.js";
import {
  confirmEmail,
  forgotPassword,
  login,
  logout,
  protect,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
} from "../controller/authController.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();
router
  .route("/")
  .get(protect, restrictTo("admin"), getAllUser)
  .post(protect, restrictTo("admin"), createUser);
router.get("/logout", logout);
router.get("/me", protect, getMe);
router.route("/myMoods").get(protect, getMyMoods);
router.route("/confirmRegistration/:token").get(confirmEmail);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword/:token").patch(resetPassword);
router.route("/editUser/:id").patch(protect, restrictTo("admin"), editUser);
router.route("/updatePassword").patch(protect, updatePassword);
router.route("/updateMe").patch(protect, updateMe);
router.route("/deleteMe").delete(protect, deleteMe);
router
  .route("/upload-avatar")
  .post(protect, upload.single("avatar"), updateAvatar);
router
  .route("/deleteUser/:id")
  .delete(protect, restrictTo("admin"), deleteUser);
router.route("/login").post(login);
router.route("/signup").post(signup);

export default router;
