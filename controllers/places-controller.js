const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const geo = require("mapbox-geocoding");
const uuid = require("uuid/v4");
const mongoose = require("mongoose");
const fs = require("fs");

const geocoder = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

geo.setAccessToken();

const getAllPlaces = async (req, res, next) => {
  let places;

  try {
    places = await Place.find();
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not find places.", 500)
    );
  }

  res.json({ places: places.map(p => p.toObject({ getters: true })) });
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Could not find a place",
      500
    );
    return next(error);
  }
  if (!place) {
    return next(new HttpError("Could not find place for provided id", 404));
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not find places"),
      500
    );
  }
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find places for provided user id", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map(place =>
      place.toObject({ getters: true })
    )
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty) {
    console.log(errors);
    next(new Error("Invalid inputs passed, please check your data", 422));
  }

  const { title, description, address } = req.body;

  let newCoords = await geocoder(address);

  newCoords = newCoords ? newCoords : { lat: 0, lng: 0 };

  const createdPlace = new Place({
    title,
    description,
    address,
    image: req.file.path,
    location: newCoords,
    creator: req.userData.userId
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("Creating place failed, please try later", 500));
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided id", 404));
  }

  try {
    // const session = await mongoose.startSession();
    // session.startTransaction();
    await createdPlace.save();
    user.places.push(createdPlace);
    await user.save();
    // await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating place failed", 500);
    return next(error);
  }
  res.status(201).json({ createdPlace });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty) {
    console.log(errors);
    return next(
      new Error("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not update place", 500)
    );
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError("You are not allowed to edit this place", 401));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not update place", 500)
    );
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not delete place", 500)
    );
  }

  if (!place) {
    return next(new HttpError("Could not find place for the id", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("You are not allowed to delete this place", 401));
  }

  const imagePath = place.image;

  try {
    await place.remove();
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not delete place", 500)
    );
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted" });
};

exports.getAllPlaces = getAllPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
