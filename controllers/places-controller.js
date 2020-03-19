const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const geo = require("mapbox-geocoding");
const uuid = require("uuid/v4");

const geocoder = require("../util/location");

geo.setAccessToken();

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire state",
    description: "Sky Scraper",
    location: {
      lat: 40.748,
      lng: -73.98715
    },
    address: "New York",
    creator: "u1"
  },
  {
    id: "p2",
    title: "Empire state",
    description: "Sky Scraper",
    location: {
      lat: 40.748,
      lng: -73.98715
    },
    address: "New York",
    creator: "u1"
  }
];

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find(p => {
    return p.id === placeId;
  });
  if (!place) {
    throw new HttpError("Could not find place for provided id", 404);
  }
  res.json({ place });
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;
  const places = DUMMY_PLACES.filter(p => {
    return p.creator === userId;
  });

  if (!places || places.length === 0) {
    throw new HttpError("Could not find places for provided user id", 404);
  }

  res.json({ places });
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

  const createdPlace = {
    id: uuid(),
    title,
    description,
    location: newCoords,
    address,
    creator
  };

  DUMMY_PLACES.push(createdPlace);

  res.status(201).json({ createdPlace });
};

const updatePlaceById = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty) {
    console.log(errors);
    throw new Error("Invalid inputs passed, please check your data", 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  const updatedPlace = { ...DUMMY_PLACES.find(p => p.id === placeId) };
  const placeIndex = DUMMY_PLACES.findIndex(p => p.id == placeId);
  updatedPlace.title = title;
  updatedPlace.description = description;

  DUMMY_PLACES[placeIndex] = updatedPlace;
  res.status(200).json({ place: updatedPlace });
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid;

  if (!DUMMY_PLACES.find(p => p.id === placeId)) {
    throw new HttpError("Could not find a place for given id: " + placeId, 404);
  }

  DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
  res.status(200).json({ message: "Deleted" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
