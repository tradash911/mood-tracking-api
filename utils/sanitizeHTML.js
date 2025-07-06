import sanitizeHtml from "sanitize-html";

const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return sanitizeHtml(input, {
      allowedTags: [], // Teljesen eltávolít minden HTML taget
      allowedAttributes: {}, // Nincsenek engedélyezett attribútumok
    });
  }
  if (typeof input === "object" && input !== null) {
    for (const key in input) {
      input[key] = sanitizeInput(input[key]); // rekurzív tisztítás
    }
  }
  return input;
};

const sanitizeHtmlMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
};

export default sanitizeHtmlMiddleware;
