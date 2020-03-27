const uuid = require("uuid/v4");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const HttpError = require("../models/http-error");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    return next(new HttpError("Fetching users failed, please try later", 500));
  }

  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty) {
    return next(
      new Error("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(
      new HttpError("Signing up failed, please try again later", 500)
    );
  }

  if (existingUser) {
    return next(
      new HttpError("User already exists, please login instead", 422)
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user", 500));
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(new HttpError("Signup failed, please try later", 500));
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email
      },
      "supersecretkey",
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Signup failed, please try later", 500));
  }

  res
    .status(201)
    .json({ user: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Login failed, please try later", 500));
  }

  if (!existingUser) {
    return next(new HttpError("Could not log you in", 403));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError("Could not log you in, please check your credentials", 500)
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError("Could not log you in, please check your credentials", 500)
    );
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email
      },
      "supersecretkey",
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Login failed, please try later", 500));
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
