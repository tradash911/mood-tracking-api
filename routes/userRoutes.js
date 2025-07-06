import express from "express";
import {
  createUser,
  deleteMe,
  deleteUser,
  editUser,
  getAllUser,
  getMyMoods,
  updateMe,
} from "../controller/userController.js";
import {
  confirmEmail,
  forgotPassword,
  login,
  protect,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
} from "../controller/authController.js";

const router = express.Router();
router
  .route("/")
  .get(protect, restrictTo("admin"), getAllUser)
  .post(protect, restrictTo("admin"), createUser);
router.route("/myMoods").get(protect, getMyMoods);
router.route("/confirmRegistration/:token").get(confirmEmail);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword/:token").patch(resetPassword);
router.route("/editUser/:id").patch(protect, restrictTo("admin"), editUser);
router.route("/updatePassword").patch(protect, updatePassword);
router.route("/updateMe").patch(protect, updateMe);
router.route("/deleteMe").delete(protect, deleteMe);
router
  .route("/deleteUser/:id")
  .delete(protect, restrictTo("admin"), deleteUser);
router.route("/login").post(login);
router.route("/signup").post(signup);

export default router;
