const geo = require('mapbox-geocoding');
const util = require('util');

const API_KEY = 'pk.eyJ1IjoibmFiZWVsbWVobW9vZCIsImEiOiJjazd2dGdhNXUxZmZoM2htcmY2c2hwZDllIn0.vIcPwJSv4raAd_IpjYO3Bg'


async function getCoordsForAddress(address, setCoords) {
    geo.setAccessToken(API_KEY);
    const getLocation = util.promisify(geo.geocode);
    
    const location = await getLocation('mapbox.places', address);

    if (location.features && location.features.length > 0) {
        return {
            lat: location.features[0].center[1],
            lng: location.features[0].center[0]
        }
    }
    return null;
};

module.exports = getCoordsForAddress;