const GaugeFactory = require('../util/gauge_factory');

class TideMetrics {
  constructor() {
    this.TIDE_HEIGHT = GaugeFactory.create({ name: 'tide_height_feet', help: 'The tide height' });
  }
}

module.exports = new TideMetrics()