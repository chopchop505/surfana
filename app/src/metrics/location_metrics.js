const GaugeFactory = require('../util/gauge_factory');

class LocationMetrics {
  constructor() {
    this.LOCATION = GaugeFactory.create({ name: 'location', help: 'Dummy Gauge to hold location status' });
  }
}

module.exports = new LocationMetrics()