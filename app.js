import express from "express";
import morgan from "morgan";
import qs from "qs";
import userRouter from "./routes/userRoutes.js";
import moodRouter from "./routes/moodRoutes.js";
import AppError from "./utils/appError.js";
import { globalErrorHandler } from "./controller/errorController.js";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import sanitizeRequest from "./utils/sanitizeRequest.js";
import sanitizeHtmlMiddleware from "./utils/sanitizeHTML.js";
import hpp from "hpp";
import cors from "cors";

/*global process, a*/
const app = express();

///need for Render
app.set("trust proxy", 1);

///security http headers
app.use(helmet());

///global middlewares
dotenv.config({ path: "./config.env" });

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

///cors

///global middlewares
dotenv.config({ path: "./config.env" });

app.use(
  cors({
    origin: "https://wondrous-truffle-e8153b.netlify.app", // csak ezt engedd!
    credentials: true,
  })
);

///rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 24 * 60 * 60 * 1000,
  message:
    "You have exceeded the number of allowed requests. Please try again in 24 hours.",
});

app.use("/api", limiter);

///body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

///data sanitization againts noSql query injection
app.use(sanitizeRequest);

///data sanitization againts XSS
app.use(sanitizeHtmlMiddleware);

///defense againts HPP attacks
app.use(hpp());

app.use((req, res, next) => {
  next();
});

/// query parser
app.set("query parser", (str) => qs.parse(str));

///routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/moods", moodRouter);

app.all("/{*any}", (req, res, next) => {
  next(new AppError("Not found", 404));
});
app.use(globalErrorHandler);
export default app;
