const CALL = Symbol('YMER#THREAD#CALL');
const EventEmitter = require('async-events-listener')

class THREAD extends EventEmitter {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.stacks = [];
  }

  async call(name, ...args) {
    await this.emit(name, ...args);
  }

  catch(...args) {
    this.stacks.push(...args);
    return this;
  }

  async off() {
    for (let i = 0; i < this.stacks.length; i++) {
      await this.stacks[i]();
    }
  }
}

module.exports = THREAD;