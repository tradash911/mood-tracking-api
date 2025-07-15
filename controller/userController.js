import Mood from "../model/moodSchema.js";
import User from "../model/userSchema.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
/*global process, a*/
const filteredOBJ = (obj, ...allowedField) => {
  let allowed = {};
  Object.keys(obj).forEach((el) => {
    if (allowedField.includes(el)) {
      allowed[el] = obj[el];
    }
  });
  return allowed;
};

export const getAllUser = async (req, res) => {
  try {
    const data = await User.find();

    res.status(200).json({
      status: "succes",
      data,
    });
  } catch (error) {
    console.log(error);
  }
};

export const createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const token = jwt.sign({ id: newUser._id }, process.env.SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  res.status(201).json({
    status: "succes",
    token,
    data: newUser,
  });
});
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(204).json({
    status: "succes",
    message: "user deleted",
  });
});

export const editUser = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 12);
  }

  const editedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      email: req.body.email,
      userName: req.body.userName,
      password: req.body.password,
      role: req.body.role,
    },
    {
      new: true,
    }
  );

  if (!editedUser) return next(new AppError("User not found", 404));

  res.status(200).json({
    status: "succes",
    data: { editedUser },
  });
});

/* export const getMyMoods = catchAsync(async (req, res) => {
  const moods = await Mood.find({ user: req.user.id }).sort({ dateAdded: -1 });
  res.status(200).json({
    status: "success",
    results: moods.length,
    data: moods,
  });
}); */

export const getMyMoods = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const moods = await Mood.find({ user: req.user.id })
    .sort({ dateAdded: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Mood.countDocuments({ user: req.user.id });

  res.status(200).json({
    status: "success",
    results: moods.length,
    page,
    totalPages: Math.ceil(total / limit),
    data: moods,
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError("This route is not for password updates"), 400);
  const filteredBody = filteredOBJ(req.body, "email");

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "succes",
    data: { user: updatedUser },
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);
  res.status(204).json({
    status: "succes",
    data: null,
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Not logged in", 401));
  }

  res.status(200).json({
    status: "success",
    data: { user: req.user },
  });
});

export const updateAvatar = async (req, res) => {
  console.log("User in req.user:", req.user);
  console.log("File in req.file:", req.file);

  try {
    if (!req.user || !req.file) {
      return res.status(400).json({ message: "Missing user or file" });
    }

    const user = await User.findById(req.user.id);
    user.photo = req.file.path;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ photo: user.photo });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Error uploading avatar" });
  }
};
