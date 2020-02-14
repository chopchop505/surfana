const GaugeFactory = require('../util/gauge_factory');

class WindMetrics {
  constructor() {
    this.WIND_SPEED = GaugeFactory.create({ name: 'wind_speed_kts', help: 'The wind speed' });
    this.WIND_DIRECTION = GaugeFactory.create({ name: 'wind_direction_degrees', help: 'The wind direction' });
    this.WIND_GUST = GaugeFactory.create({ name: 'wind_gust_kts', help: 'The wind gust' });
  }
}

module.exports = new WindMetrics()