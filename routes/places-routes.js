const express = require("express");
const router = express.Router();

const placesControllers = require('../controllers/places-controller');

router.get("/", (req, res, next) => {
  console.log("GET REQUEST in places");
  res.json({ message: "it works" });
});

router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.post('/', placesControllers.createPlace);

router.patch('/:pid', placesControllers.updatePlaceById);

router.delete('/:pid', placesControllers.deletePlace);


module.exports = router;
