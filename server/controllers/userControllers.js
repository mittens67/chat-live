const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

/** Escapes regex metacharacters so a search term is matched literally. */
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  picture: user.picture,
  token: generateToken(user._id),
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, picture } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  try {
    const user = await User.create({ name, email, password, picture });
    res.status(201).json(toAuthResponse(user));
  } catch (error) {
    //The unique index is the real guard - the check above races with itself
    //when two registrations for the same address arrive together
    if (error.code === 11000) {
      res.status(400);
      throw new Error("User already exists");
    }
    throw error;
  }
});

//@description     Auth the user
//@route           POST /api/user/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Both email and password are required");
  }

  //password is select:false on the schema, so it has to be asked for by name
  const user = await User.findOne({ email }).select("+password");

  if (user && (await user.matchPassword(password))) {
    res.json(toAuthResponse(user));
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

//@description     Get or search all users
//@route           GET /api/user?search=
//@access          Protected
const allUsers = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  //Escaped, so a term like "(a+)+$" is matched as text rather than compiled
  //into a pattern that pins the database CPU
  const keyword = search
    ? {
        $or: [
          { name: { $regex: escapeRegex(search), $options: "i" } },
          { email: { $regex: escapeRegex(search), $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select("name picture email")
    .limit(30);

  res.json(users);
});

module.exports = { registerUser, authUser, allUsers };
