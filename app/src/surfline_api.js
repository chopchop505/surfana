'use_strict';

const axios = require('axios')
const _ = require('lodash');

const SEARCH_URL = 'https://services.surfline.com/search/site'
const FORECAST_URL = 'https://services.surfline.com/kbyg/spots/forecasts';
const REGION_URL = 'https://services.surfline.com/kbyg/regions/overview';

class SurflineClient {
    constructor () {
    }

    forecastOverview (params = null) {
        return axios.get(REGION_URL, { params });
    }

    /**
     * Return location data like spotId
     *
     * @param {String} query
     * @return {Promise}
     */
    search (params = null) {
        return axios.get(SEARCH_URL, { params })
    }

    forecastConditions (params = null) {
        return axios.get(FORECAST_URL + '/conditions', { params });
    }

    /**
     * get the forecast for waves
     *
     * @param {Object} params
     * @return {Promise}
     */
    forecastWaves (params = null) {
        return axios.get(FORECAST_URL + '/wave', { params });
    }

    /**
     * get the forecast for wind
     *
     * @param {Object} params
     * @return {Promise}
     */
    forecastWind (params = null) {
        return axios.get(FORECAST_URL + '/wind', { params });
    }

    /**
     * get the forecast for tides
     *
     * @param {Object} params
     * @return {Promise}
     */
    forecastTides (params = null) {
        return axios.get(FORECAST_URL + '/tides', { params });
    }

    /**
     * get the forecast for weather
     *
     * @param {Object} params
     * @return {Promise}
     */
    forecastWeather(params = null) {
        return axios.get(FORECAST_URL + '/weather', { params });
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
          }
        }),
      };
    }

}

module.exports = new SurflineClient()