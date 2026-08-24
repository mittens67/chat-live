const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const asyncHandler = require("express-async-handler");

/**
 * Verifies the bearer token and attaches the user to the request.
 *
 * Note this only establishes identity. Anything that touches a specific chat
 * must additionally check membership - see middleware/chatAccess.js.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return null;
  }
};

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  const decoded = verifyToken(header.split(" ")[1]);

  if (!decoded) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }

  const user = await User.findById(decoded.id);

  //A token can outlive the account it names
  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user no longer exists");
  }

  req.user = user;

  //Outside the try above by design: a throw from a downstream handler must not
  //be caught here and remasked as a 401
  next();
});

module.exports = { protect, verifyToken };
