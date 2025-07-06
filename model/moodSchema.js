import mongoose from "mongoose";
import { format } from "date-fns";
const moodSchema = new mongoose.Schema(
  {
    mood: {
      type: Number,
      required: [true, "Please select a mood"],
      enum: {
        values: [1, 2, 3, 4, 5],
        message: "Mood is either: 1,2,3,4,5",
      },
    },
    dateAdded: {
      type: String,
      default: () => format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    },
    sleep: {
      type: Number,
      required: [true, "Sleep duration is required to generate your stats."],
      validate: {
        validator: function (val) {
          return val < 20;
        },
        message: `Sleeping hours can't be over 20`,
      },
    },
    log: {
      type: String,
      maxLenght: 1000,
    },
    photo: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ez itt a kapcsolat,
      required: true,
    },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Mood = mongoose.model("moods", moodSchema);
export default Mood;
