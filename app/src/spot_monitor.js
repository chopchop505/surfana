'use_strict';

const promClient = require('prom-client');
const _ = require('lodash');
const moment = require('moment');
const ngeohash = require('ngeohash');

const Surfline = require('./surfline_api');

const ConditionsMetrics = require('./metrics/conditions_metrics');
const TideMetrics = require('./metrics/tide_metrics');
const WaveMetrics = require('./metrics/wave_metrics');
const WeatherMetrics = require('./metrics/weather_metrics');
const WindMetrics = require('./metrics/wind_metrics');

const AcceleratedTime = require('./util/accelerated_time');
const Logger = require('./util/logger');

class SpotMonitor {
  constructor(params = null) {
    console.dir(params)
    this.spotId = params.spotId;
    this.spotName = params.spotName;

    this.subregionId = params.subregionId;
    this.subregionName = params.subregionName;

    this.daysToForecast = params.daysToForecast || 5;
    this.intervalHours = params.intervalHours || 1;

    this.spotLat = params.spotLat;
    this.spotLon = params.spotLon;

    this.globalLabels = {
      spotId: this.spotId,
      spotName: this.spotName,
      spotGeohash: ngeohash.encode(this.spotLat, this.spotLon),
      subregionId: params.subregionId,
      subregionName: params.subregionName,
    }
  }

  start() {
    this.forecastConditions();
  }

  forecastConditions() {
    Surfline.forecastConditions({
      spotId: this.spotId,
      days: this.daysToForecast,
      intervalHours: this.intervalHours
    }).then((data) => {
      /* Example response:
          data:
            { associated:
                { units:
                  { temperature: 'C',
                    tideHeight: 'M',
                    waveHeight: 'M',
                    windSpeed: 'KPH' },
                  utcOffset: -10 },
              data:
                { conditions:
                  [ { timestamp: 1581674400,
                      forecaster:
                        { name: 'Kevin Wallis',
                          avatar: 'https://www.gravatar.com/avatar/7b56791847d5971c1dce71f35fba259d?d=mm' },
                      human: true,
                      observation: 'Modest NW swell. Some E tradeswell wrap mixing in. Breezy easterly trades. ',
                      am:
                        { maxHeight: 0.9,
                          minHeight: 0.6,
                          plus: true,
                          humanRelation: '0.6-0.9 m – knee to waist high',
                          occasionalHeight: 1.2,
                          rating: 'FAIR' },
                      pm:
                        { maxHeight: 0.9,
                          minHeight: 0.6,
                          plus: true,
                          humanRelation: '0.6-0.9 m – knee to waist high',
                          occasionalHeight: 1.2,
                          rating: 'FAIR' } },
                    { timestamp: 1581760800,
                      forecaster:
                        { name: 'Kevin Wallis',
                          avatar: 'https://www.gravatar.com/avatar/7b56791847d5971c1dce71f35fba259d?d=mm' },
                      human: true,
                      observation: 'New NW swell to slowly fill in. Some E tradeswell wrap mixing in. Strong easterly trades. ',
                      am:
                        { maxHeight: 1.5,
                          minHeight: 1.2,
                          plus: false,
                          humanRelation: '1.2-1.5 m – chest to head high',
                          occasionalHeight: null,
                          rating: 'FAIR_TO_GOOD' },
      */
      if (_.get(data, 'data.data.conditions')) {
        // Only store the conditions based on the closest time period
        const conditions = findClosetDataPoint(data.data.data.conditions, -12, 12);
        if (conditions) {
          this.setGauge(ConditionsMetrics.SURF_HEIGHT_MAX, conditions.am, 'maxHeight', { timeBlock: 'am' });
          this.setGauge(ConditionsMetrics.SURF_HEIGHT_MIN, conditions.am, 'minHeight', { timeBlock: 'am' });
          this.setGauge(ConditionsMetrics.SURF_HEIGHT_OCCASIONAL, conditions.am, 'occasionalHeight', { timeBlock: 'am' });

          this.setGauge(ConditionsMetrics.SURF_HEIGHT_MAX, conditions.pm, 'maxHeight', { timeBlock: 'pm' });
          this.setGauge(ConditionsMetrics.SURF_HEIGHT_MIN, conditions.pm, 'minHeight', { timeBlock: 'pm' });
          this.setGauge(ConditionsMetrics.SURF_HEIGHT_OCCASIONAL, conditions.pm, 'occasionalHeight', { timeBlock: 'pm' });

          this.setLoki(conditions, 'observation', { commentaryType: 'tide_type', commentator: conditions.forecaster.name });
          this.setLoki(conditions, 'am.humanRelation', { timeBlock: 'am', commentaryType: 'human_relation', commentator: conditions.forecaster.name });
          this.setLoki(conditions, 'pm.humanRelation', { timeBlock: 'pm', commentaryType: 'human_relation', commentator: conditions.forecaster.name });
          this.setLoki(conditions, 'am.rating', { timeBlock: 'am', commentaryType: 'rating', commentator: conditions.forecaster.name });
          this.setLoki(conditions, 'pm.rating', { timeBlock: 'pm', commentaryType: 'rating', commentator: conditions.forecaster.name });
        }
      }
    })
  }

  forecastTides() {
    Surfline.forecastTides({
      spotId: this.spotId,
      days: this.daysToForecast,
      intervalHours: this.intervalHours
    }).then((data) => {
      /* Example response:
         data:
          { associated:
              { utcOffset: -10,
                units:
                { temperature: 'F',
                  tideHeight: 'FT',
                  waveHeight: 'FT',
                  windSpeed: 'KTS' },
                tideLocation:
                { name: 'Haleiwa, Waialua Bay, Oahu Island',
                  min: -0.39,
                  max: 2.2,
                  lon: -158.1166,
                  lat: 21.6,
                  mean: 0.69 } },
            data:
              { tides:
                [ { timestamp: 1581674400, type: 'NORMAL', height: 0.49 },
                  { timestamp: 1581675900, type: 'LOW', height: 0.46 },
                  { timestamp: 1581678000, type: 'NORMAL', height: 0.46 },
                  { timestamp: 1581681600, type: 'NORMAL', height: 0.52 },
                  ...
      */
      if (_.get(data, 'data.data.tides')) {
        // Only store the conditions based on the closest time period
        const tide = findClosetDataPoint(data.data.data.tides);
        if (tide) {
          this.setGauge(TideMetrics.TEMPERATURE, tide, 'height');
          this.setLoki(tide, 'tide', { commentaryType: 'tide_type' });
        }
      }
    })
  }

  forcasetWeather() {
    Surfline.forecastWeather({
      spotId: this.spotId,
      days: this.daysToForecast,
      intervalHours: this.intervalHours
    }).then((data) => {
      /* Example response
      data:
        { associated:
            { units:
              { temperature: 'F',
                tideHeight: 'FT',
                waveHeight: 'FT',
                windSpeed: 'KTS' },
              utcOffset: -10,
              weatherIconPath: 'https://wa.cdn-surfline.com/quiver/0.6.2/weathericons' },
          data:
            { sunlightTimes:
              [ { midnight: 1581674400,
                  dawn: 1581698578,
                  sunrise: 1581699945,
                  sunset: 1581741059,
                  dusk: 1581742426 },
                { midnight: 1581760800,
                  dawn: 1581784944,
                  sunrise: 1581786309,
                  sunset: 1581827491,
                  dusk: 1581828856 },
                { midnight: 1581847200,
                  dawn: 1581871309,
                  sunrise: 1581872673,
                  sunset: 1581913922,
                  dusk: 1581915286 },
                { midnight: 1581933600,
                  dawn: 1581957673,
                  sunrise: 1581959035,
                  sunset: 1582000353,
                  dusk: 1582001715 },
                { midnight: 1582020000,
                  dawn: 1582044036,
                  sunrise: 1582045396,
                  sunset: 1582086784,
                  dusk: 1582088143 } ],
              weather:
              [ { timestamp: 1581674400,
                  temperature: 73.9,
                  condition: 'NIGHT_CLEAR_NO_RAIN' },
                { timestamp: 1581678000,
                  temperature: 73.9,
                  condition: 'NIGHT_CLEAR_NO_RAIN' },
                  ...
      */
      if (_.get(data, 'data.data.weather')) {
        // Only store the conditions based on the closest time period
        const weather = findClosetDataPoint(data.data.data.weather);
        if (weather) {
          this.setGauge(WeatherMetrics.TEMPERATURE, weather, 'temperature');
          this.setLoki(weather, 'condition', { commentaryType: 'weather_condition' });
        }
      }
    })
  }

  forcasetWind() {
    Surfline.forecastWind({
      spotId: this.spotId,
      days: this.daysToForecast,
      intervalHours: this.intervalHours
    }).then((data) => {
      /* Example response
      data:
        { associated:
            { units:
              { temperature: 'F',
                tideHeight: 'FT',
                waveHeight: 'FT',
                windSpeed: 'KTS' },
              utcOffset: -10,
              location: { lon: -158.05477738380432, lat: 21.666103103102223 } },
          data:
            { wind:
              [ { timestamp: 1581674400,
                  speed: 13.96,
                  direction: 84.11,
                  gust: 19.2,
                  optimalScore: 0 },
                { timestamp: 1581678000,
                  speed: 13.63,
                  direction: 86.46,
                  gust: 18.74,
                  optimalScore: 2 },
                  ...
      */
      if (_.get(data, 'data.data.wind')) {
        // Only store the conditions based on the closest time period
        const wind = findClosetDataPoint(data.data.data.wind);
        if (wind) {
          this.setGauge(WindMetrics.WIND_SPEED, wind, 'speed');
          this.setGauge(WindMetrics.WIND_DIRECTION, wind, 'direction');
          this.setGauge(WindMetrics.WIND_GUST, wind, 'gust');
        }
      }
    })
  }

  forcasetWaves() {
    Surfline.forecastWaves({
      spotId: this.spotId,
      days: this.daysToForecast,
      intervalHours: this.intervalHours
    }).then((data) => {
      /* Example response:
        data:
          { associated:
              { units:
                { temperature: 'F',
                  tideHeight: '
                  waveHeight: 'FT',
                  windSpeed: 'KTS' },
                utcOffset: -8,
                location: { lon: -117.8819918632, lat: 33.5930302087 },
                forecastLocation: { lon: -117.882, lat: 33.593 },
                offshoreLocation: { lon: -117.9, lat: 33.55 } },
            data:
              { wave:
                [ { timestamp: 1581580800,
                    surf: { min: 1.94, max: 3.22, optimalScore: 0 },
                    swells:
                      [ { height: 0.39,
                          period: 14,
                          direction: 281.25,
                          directionMin: 277.73,
                          optimalScore: 0 },
                        ...
                        { height: 0,
                          period: 0,
                          direction: 0,
                          directionMin: 0,
                          optimalScore: 0 } ] },
                          ....
        */
      if (_.get(data, 'data.data.wave')) {
        // Only store the conditions based on the closest time period
        const wave = findClosetDataPoint(data.data.data.wave);
        if (wave) {
          this.setGauge(WaveMetrics.SURF_HEIGHT_MIN, wave, 'surf.min');
          this.setGauge(WaveMetrics.SURF_HEIGHT_MAX, wave, 'surf.max');
          wave.swells.forEach((swell, index) => {
            if (swell.height) {
              let labels = { swellId: index };
              this.setGauge(WaveMetrics.SWELL_HEIGHT, swell, 'height', labels);
              this.setGauge(WaveMetrics.SWELL_PERIOD, swell, 'period', labels);
              this.setGauge(WaveMetrics.SWELL_DIRECTION_MIN, swell, 'directionMin', labels);
              this.setGauge(WaveMetrics.SWELL_DIRECTION_MAX, swell, 'direction', labels);
            }
          });
        }
      }
    })
  }

  setGauge(metric, obj, path, labels) {
    let value = _.get(obj, path);

    if (!_.isNil(metric) && !_.isNil(value)) {
      metric.set(_.merge({}, this.globalLabels, labels), value);
    }
  }

  setLoki(obj, path, labels) {
    let value = _.get(obj, path);
    if (!_.isNil(value)) {
      Logger.info(_.merge({}, this.globalLabels, labels, { message: value }));
    }
  }
}

function findClosetDataPoint(array, min = 0, max = 1) {
  return _.find(array, obj => {
    const timestamp = obj.timestamp;
    if (timestamp) {
      let forecastTime = moment(timestamp * 1000);
      let closetTimestamp = moment.duration(forecastTime.diff(AcceleratedTime.now())).as('hours');
      if (closetTimestamp > min && closetTimestamp < max) {
        return true;
      }
    }
    return false;
  })
}

module.exports = SpotMonitor;