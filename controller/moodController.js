import Mood from "../model/moodSchema.js";
import APIfeatures from "../utils/APIfeatures.js";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

export const allMood = catchAsync(async (req, res, next) => {
  const features = new APIfeatures(Mood.find(), req.query)
    .filter()
    .sort()
    .limiting()
    .paginate();
  const moods = await features.query.populate("user");

  res.status(200).json({
    message: "succes",
    moods,
  });
});

export const createMood = catchAsync(async (req, res, next) => {
  const user = req.user;
  const now = new Date();

  const midnightUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );

  if (new Date() > user.canCreateMood) {
    const data = await Mood.create({
      mood: req.body.mood,
      sleep: req.body.sleep,
      log: req.body.log,
      photo: req.body.photo,
      user: req.user._id,
      feelings: req.body.feelings,
      quote: req.body.quote,
    });
    user.canCreateMood = midnightUTC;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({
      message: "Mood created",
      data,
    });
  } else {
    return next(new AppError("You can only post a mood once a day!", 403));
  }
});

export const editMood = catchAsync(async (req, res, next) => {
  const user = req.user;
  const mood = await Mood.findByIdAndUpdate(
    req.params.id,
    {
      mood: req.body.mood,
      sleep: req.body.sleep,
      log: req.body.log,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (mood.user.toString() !== user.id)
    return next(new AppError("Cannot modify another user's mood", 403));

  res.status(200).json({
    status: "succes",
    data: {
      mood,
    },
  });
});
