const GaugeFactory = require('../util/gauge_factory');

class WeatherMetrics {
  constructor() {
    this.TEMPERATURE = GaugeFactory.create({ name: 'temperature_fahrenheit', help: 'The temperature' });
  }
}

module.exports = new WeatherMetrics()