const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const DEFAULT_AVATAR = require("../config/defaultAvatar");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    //select: false keeps the hash out of query results unless asked for
    //explicitly, so it cannot leak through a forgotten projection
    password: { type: String, required: true, minlength: 8, select: false },
    picture: {
      type: String,
      required: true,
      default: DEFAULT_AVATAR,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function () {
  //isModified is a method - calling it is what makes this guard work. Without
  //it every save re-hashes the already-hashed password and locks the user out.
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
