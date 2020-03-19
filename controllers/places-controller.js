const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const geo = require("mapbox-geocoding");
const uuid = require("uuid/v4");

const geocoder = require("../util/location");
const Place = require("../models/place");

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
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not find places"),
      500
    );
  }
  if (!places || places.length === 0) {
    return next(
      new HttpError("Could not find places for provided user id", 404)
    );
  }

  res.json({ places: places.map(place => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty) {
    console.log(errors);
    next(new Error("Invalid inputs passed, please check your data", 422));
  }

  const { title, description, address, creator } = req.body;

  let newCoords = await geocoder(address);

  newCoords = newCoords ? newCoords : { lat: 0, lng: 0 };

  const createdPlace = new Place({
    title,
    description,
    address,
    image: "https://source.unsplash.com/random",
    location: newCoords,
    creator
  });

  try {
    await createdPlace.save();
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
    throw new Error("Invalid inputs passed, please check your data", 422);
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
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not delete place", 500)
    );
  }

  try {
    await place.remove();
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not delete place", 500)
    );
  }

  res.status(200).json({ message: "Deleted" });
};

exports.getAllPlaces = getAllPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
