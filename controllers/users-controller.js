const uuid = require("uuid/v4");
const { validationResult } = require("express-validator");

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

  const createdUser = new User({
    name,
    email,
    image: "https://source.unsplash.com/random",
    password,
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(new HttpError("Signup failed, please try later", 500));
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Login failed, please try later", 500));
  }

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError("Could not log you in", 401));
  }

  res.json({ message: "Logged in" });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
