import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import AppError from "../utils/appError.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "user-avatars",
    resource_type: "image",
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPG, JPEG, and PNG files are allowed."), false);
  }
};

export const upload = multer({ storage, fileFilter });
