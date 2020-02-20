'use_strict';

const URL = require('url');
const fs = require('fs');
const util = require('util');

const axios = require('axios')
const _ = require('lodash');
const hasher = require('node-object-hash')({ sort: true, coerce: true });

const FORECAST_URL = 'https://services.surfline.com/kbyg/spots/forecasts';
const REGION_URL = 'https://services.surfline.com/kbyg/regions/overview';

// Running in offline mode, just returns sample responses
// This is useful for demos, you know....when something inevitably goes wrong
if (process.env.OFFLINE) {
  const MockAdapter = require('axios-mock-adapter');
  const mock = new MockAdapter(axios);
  const fs = require('fs');

  mock.onGet().reply((config) => {
    // get the mocked response on disk
    const dirName = `./data/offline${new URL.URL(config.url).pathname}`;
    const fileName = hasher.hash(config.params)

    let response = fs.readFileSync(`${dirName}/${fileName}`);
    return [200, JSON.parse(response)];
  });
}

class SurflineClient {
  constructor() {
  }

  async _apiCall(myUrl, params = null) {
    let response = await axios.get(myUrl, { params });

    // If we are seeding the OFFLINE data, write to disk
    if (process.env.SEED_OFFLINE) {
      const dirName = `./data/offline${new URL.URL(myUrl).pathname}`;
      const fileName = hasher.hash(params)

      await fs.promises.mkdir(`${dirName}`, { recursive: true });
      await fs.promises.writeFile(`${dirName}/${fileName}`, JSON.stringify(response.data));
    }

    return response;
  }

  forecastOverview(params = null) {
    return this._apiCall(REGION_URL, params);
  }

  forecastConditions(params = null) {
    return this._apiCall(`${FORECAST_URL}/conditions`, params);
  }

  forecastWaves(params = null) {
    return this._apiCall(`${FORECAST_URL}/wave`, params);
  }

  forecastWind(params = null) {
    return this._apiCall(`${FORECAST_URL}/wind`, params);
  }

  forecastTides(params = null) {
    return this._apiCall(`${FORECAST_URL}/tides`, params);
  }

  forecastWeather(params = null) {
    return this._apiCall(`${FORECAST_URL}/weather`, params);
  }

  async getSubregionInfo(params = null) {
    let response = await this.forecastOverview(params);

    return {
      id: response.data.data._id,
      name: response.data.data.name,
      spots: _.map(response.data.data.spots, spot => {
        return {
          id: spot._id,
          name: spot.name,
          lat: spot.lat,
          lon: spot.lon,
          cameras: _.map(spot.cameras, camera => {
            return {
              id: camera._id,
              streamUrl: camera.streamUrl,
              stillUrl: camera.stillUrl,
              rewindClip: camera.rewindClip,
            }
          })
        }
      }),
    };
  }

}

module.exports = new SurflineClient()