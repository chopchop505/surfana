const moment = require('moment');

const Logger = require('./logger');

class AcceleratedTime {
  constructor() {
    this.start = new moment();
    this.accelerator = process.env.CLOCK_SPEED || 1;

    setInterval(() => {
      Logger.debug(`Projecting time: ${this.now().format()} to now`)
    }, 1000);
  }

  now() {
    let now = new moment();
    let secondsLater = moment.duration(now.diff(this.start)).as('seconds') * this.accelerator;

    return moment(this.start).add(secondsLater, 'seconds');
  }
}

module.exports = new AcceleratedTime();