const GaugeFactory = require('../util/gauge_factory');

class WaveMetrics {
  constructor() {
    this.SURF_HEIGHT_MIN = GaugeFactory.create({ name: 'surf_height_min_feet', help: 'The minimum wave height' });
    this.SURF_HEIGHT_MAX = GaugeFactory.create({ name: 'surf_height_max_feet', help: 'The maximum wave height' });
    this.SWELL_HEIGHT = GaugeFactory.create({ name: 'swell_height_feet', help: 'The height of an indivual swell', labelNames: ['swellId'] });
    this.SWELL_PERIOD = GaugeFactory.create({ name: 'swell_period_feet', help: 'The period of an indivual swell', labelNames: ['swellId'] });
    this.SWELL_DIRECTION_MIN = GaugeFactory.create({ name: 'swell_direction_min_degrees', help: 'The minimum compass direction of an indivual swell', labelNames: ['swellId'] });
    this.SWELL_DIRECTION_MAX = GaugeFactory.create({ name: 'swell_direction_max_degrees', help: 'The maximum compass direction of an indivual swell', labelNames: ['swellId'] });
  }
}

module.exports = new WaveMetrics()