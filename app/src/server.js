'use strict';

const express = require('express');
const promClient = require('prom-client');
const register = promClient.register;
const util = require('util')

const AcceleratedTime = require('./util/accelerated_time');
const Logger = require('./util/logger');

const SpotMonitor = require('./spot_monitor');
const Surfline = require('./surfline_api');
const Config = require('./config');

// Get some metadata about this subregion
const subregionId = Config.subregionId;
Surfline.getSubregionInfo({ subregionId }).then((subregion) => {
  // Start monitoring each spot in the subregion
  Logger.info(`Monitoring subregion: ${subregion.name}`);

  subregion.spots.forEach((spot, index) => {
    Logger.info(`Monitoring spot: ${spot.name}`);

    // If the spot has got cameras, lets start monitoring it
    if (spot.cameras.length > 0) {
      const sm = new SpotMonitor({
        spotId: spot.id,
        spotName: spot.name,
        spotLat: spot.lat,
        spotLon: spot.lon,
        subregionId: subregion.id,
        subregionName: subregion.name,
        cameras: spot.cameras,
      });

      sm.start();
    }
  });

  // Define express endpoints
  const app = express();
  app.get('/metrics', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  });

  // Start listening
  const port = 3001;
  Logger.info(
    `Server listening to ${port}, metrics exposed on /metrics endpoint`
  );
  app.listen(port);
})
