// middleware/sanitizeRequest.js
import sanitize from "mongo-sanitize";

const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;

  for (const key in obj) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    } else {
      obj[key] = sanitize(obj[key]);
    }
  }

  return obj;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

export default sanitizeRequest;
