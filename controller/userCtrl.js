// Assume your User model definition includes the necessary schema and bcrypt for password comparison
const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbid");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../controller/emailCtrl");
// create a user

const createUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("User Already Exists");
    }

    const newUser = await User.create(req.body);
    res.json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// login a user

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    res.json({
      _id: findUser?._id,
      name: findUser?.name,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credential");
  }
});

// handle refresh token

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No refresh token in cookie");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error("No refresh token present in db or not match");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decode) => {
    if (err || user.id !== decode.id) {
      throw new Error("there is  something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

// logout dependancy

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;

  if (!cookie?.refreshToken) {
    throw new Error("No refresh token in cookie");
  }

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });

  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204);
  }

  // Assuming you have a unique identifier like _id for the user
  const userId = user._id;

  try {
    // Update the user's refreshToken to an empty string
    await User.findByIdAndUpdate(userId, {
      refreshToken: "",
    });

    // Clear the refreshToken cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });

    // Send a 204 No Content response
    res.sendStatus(204);
  } catch (error) {
    // Handle any errors that occur during the database update
    res.status(500).json({ error: error.message });
  }
});

// update a user

const updatedaUser = asyncHandler(async (req, res) => {
  console.log();
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const updatedaUser = await User.findByIdAndUpdate(
      _id,
      {
        name: req?.body?.name,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      { new: true }
    );
    res.json(updatedaUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get all user

const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUser = await User.find();
    res.json(getUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  get a single user
const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  delete a single user
const deleteaUser = asyncHandler(async (req, res) => {
  console.log(req.params);
  const { id } = req.params;
  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const blockUser = await User.findByIdAndUpdate(
      id,
      { isblocked: true },
      { new: true }
    );
    res.json({ message: "User Blocked", user: blockUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const unblockUser = await User.findByIdAndUpdate(
      id,
      { isblocked: false },
      { new: true }
    );
    res.json({ message: "User Unblocked", user: unblockUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body; // Corrected the variable name to password
  validateMongoDbId(_id);
  const user = await User.findById(_id);

  if (password) {
    user.password = password; // Corrected the variable name to user.password
    const updatePassword = await user.save();
    res.json(updatePassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  try {
    const token = await user.createPasswordResetToken();
    await user.save();

    const resetURL = `Hi please tab the link for reset. valid for 10 minutes.<a href='http://localhost:4000/api/user/reset-password/${token}'>click hare</>`;
    const data = {
      to: email,
      text: "hey user",
      subject: "Forgot password link",
      html: resetURL,
    };

    // Call the sendEmail function and await it
    await sendEmail(data);

    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error("Expired!! Try again..");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

module.exports = {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedaUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
};
