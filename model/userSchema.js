import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Please enter a name"],
    unique: [true, "username alreay exists"],
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: 8,
    select: false,
    validate: {
      validator: function (value) {
        // Regex: at least one lowercase letter, one uppercase letter, and one number
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value);
      },
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    },
  },

  email: {
    type: String,
    required: [true, "Please enter your email address"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Invalid email address"],
  },
  role: {
    type: String,
    default: "user",
    enum: {
      values: ["user", "admin"],
    },
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please enter your password again"],
    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: "your passwords not match!",
    },
  },
  active: {
    type: Boolean,
    default: false,
  },
  canCreateMood: {
    type: Date,
    default: Date.now,
  },

  photo: String,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailConfirmToken: String,
  emailConfirmExpires: Date,
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});
///Mongoose instance method, amelyet minden egyes User dokumentum példány képes meghívni, és azt ellenőrzi, hogy a beírt jelszó (amit a felhasználó beír pl. a login űrlapon) megegyezik-e az adatbázisban tárolt (hashelt) jelszóval.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = new Date() - 1000;
  next();
});

userSchema.methods.changedPasswordAfter = function (JTWTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(changedAt, JTWTimestamp);
    return JTWTimestamp < changedAt;
  }
  ///False means not changed
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

userSchema.methods.createEmailConfirmToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.emailConfirmToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailConfirmExpires = Date.now() + 10 * 60 * 1000;

  return token;
};

const User = mongoose.model("User", userSchema);

export default User;
