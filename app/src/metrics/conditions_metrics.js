const GaugeFactory = require('../util/gauge_factory');

class ConditionsMetrics {
  constructor() {
    this.SURF_HEIGHT_MIN = GaugeFactory.create({ name: 'am_surf_height_min_feet', help: 'The minimum wave height', labelNames: ['timeBlock'] });
    this.SURF_HEIGHT_MAX = GaugeFactory.create({ name: 'am_surf_height_max_feet', help: 'The maximum wave height', labelNames: ['timeBlock'] });
    this.SURF_HEIGHT_OCCASIONAL = GaugeFactory.create({ name: 'am_surf_height_occasional_feet', help: 'The occasional wave height', labelNames: ['timeBlock'] });
  }
}

module.exports = new ConditionsMetrics()