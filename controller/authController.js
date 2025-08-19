import User from "../model/userSchema.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emails.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
/*global process, a*/
const signToken = (user) => {
  const token = jwt.sign({ id: user }, process.env.SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  return token;
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    path: "/",
    sameSite: "none",
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
  /*  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    path: "/",
    sameSite: "None",
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions); */

  ///Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "succes",
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    active: false,
  });

  try {
    const token = newUser.createEmailConfirmToken();
    await newUser.save({ validateBeforeSave: false });

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const confirmURL = `${frontendBaseUrl}/confirmEmail/${token}`;

    const message = `Please confirm your email by clicking <a href="${confirmURL}">here</a>. \n If you didn’t request this, please ignore this email.`;

    await sendEmail({
      email: newUser.email,
      subject: "Confirm your email",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Confirmation email sent. Please verify your email.",
      newUser: newUser.email,
    });
  } catch (err) {
    console.error("Signup email error:", err.message);

    res.status(200).json({
      status: "success",
      message: "Signed up, but email sending failed. Try confirming later.",
    });
  }
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  ///check eamil and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  ///check user  exits and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user.active) {
    return next(
      new AppError("Please confirm your email to activate your account.", 403)
    );
  }

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password", 401));
  ///send the token back to client
  createSendToken(user, 200, res);
});

export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None", // or "None" for cross-origin frontend
    expires: new Date(Date.now() + 10 * 1000),
  });

  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully" });
};

export const protect = catchAsync(async (req, res, next) => {
  let token;
  ///get token and check if it is exits
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next(new AppError("You are not logged in!", 401));
  ///validate token
  const decodedToken = await promisify(jwt.verify)(token, process.env.SECRET);

  ///check user still exists
  const currentUser = await User.findById(decodedToken.id);
  if (!currentUser) {
    return next(
      new AppError("The user belong to this token does no longer exist", 401)
    );
  }

  ///check user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decodedToken.iat)) {
    return next(
      new AppError("User recently changed password, please log in again", 401)
    );
  }
  ///Grant acces to protected route
  req.user = currentUser;
  next();
});

export function restrictTo(role) {
  return function (req, res, next) {
    if (role !== req.user.role) {
      next(new AppError("You do have permission to perform this action!", 403));
    }
    next();
  };
}
////Password reset
export const forgotPassword = catchAsync(async function (req, res, next) {
  //User megtalálása email alapján
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with that email address", 404));
  }
  ///Token generálása
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetURL = `${frontendBaseUrl}/confirmResetPassword/${resetToken}`;

  const message = `Forgot your password? reset <a href="${resetURL}"> here <a/>  \n If you didn't, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset",
      message,
    });

    res.status(200).json({
      status: "succes",
      message: "Token sent to email",
    });
  } catch (error) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined);
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was an error sending the email", 400));
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  ///Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  ///If token has not expired, and there is user,reset password
  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async function (req, res, next) {
  const user = await User.findById(req.user.id).select("+password");

  const currentPassword = await bcrypt.compare(
    req.body.currentPassword,
    user.password
  );

  if (!currentPassword)
    return next(new AppError("Please enter you current password", 401));

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

  if (!strongPasswordRegex.test(req.body.newPassword)) {
    return next(
      new AppError(
        "Password must contain at least one lowercase letter, one uppercase letter, and one number.",
        400
      )
    );
  }

  user.password = req.body.newPassword;

  await user.save({ validateBeforeSave: false });
  createSendToken(user, 200, res);
});

export const confirmEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    emailConfirmToken: hashedToken,
    emailConfirmExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.active = true;
  user.emailConfirmToken = undefined;
  user.emailConfirmExpires = undefined;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

export const changeEmailAddress = catchAsync(async function (req, res, next) {
  const isEmailInUse = await User.findOne({ email: req.body.nextEmail });

  const user = await User.findOne({ email: req.user.email });

  if (!user) {
    return next(new AppError("Please log in!", 404));
  }

  if (isEmailInUse)
    return next(new AppError("This email address is already in use", 400));

  ///Token generálása
  const resetToken = user.createEmailChangeToken();
  user.nextEmailAddress = req.body.nextEmail;
  await user.save({ validateBeforeSave: false });

  const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetURL = `${frontendBaseUrl}/confirmChangeEmail/${resetToken}`;

  const message = `To change your email address, please click the following link: <a href="${resetURL}"> click here <a/> \n If you did not request this change, please disregard this message.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Change email",
      message,
    });

    res.status(200).json({
      status: "succes",
      message:
        "Confirmation email has been sent. Please check your current inbox.",
    });
  } catch (error) {
    (user.emailChangeToken = undefined),
      (user.emailChangeTokenExpires = undefined);
    await user.save({ validateBeforeSave: false });
    return next(new AppError("there was an error sending the email", 400));
  }
});

export const confirmChangeEmailAddress = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    emailChangeToken: hashedToken,
    emailChangeTokenExpires: { $gt: new Date() },
  });

  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  user.email = user.nextEmailAddress;
  user.emailChangeToken = undefined;
  user.emailChangeTokenExpires = undefined;
  user.nextEmailAddress = undefined;

  await user.save({ validateBeforeSave: false });
  createSendToken(user, 200, res);
});
