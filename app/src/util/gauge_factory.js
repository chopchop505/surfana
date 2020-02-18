'use_strict';

const promClient = require('prom-client');

class GaugeFactory {
  constructor() {
  }

  create(params) {
    const { name, help } = params;
    const labelNames = params.labelNames || [];

    return new promClient.Gauge({
      name,
      help,
      labelNames: [
        'spotId',
        'spotName',
        'spotGeohash',
        'subregionId',
        'subregionName',
      ].concat(labelNames)
    });
  }
}

module.exports = new GaugeFactory()