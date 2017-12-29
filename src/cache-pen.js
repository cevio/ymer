module.exports = class CachePen {
  constructor() {
    this.stacks = {};
  }

  set(name, time = 0, fn) {
    if (typeof time === 'function') {
      fn = time;
      time = 0;
    }
    this.stacks[name] = {
      time, fn
    };
  }

  get(name) {
    return this.stacks[name];
  }

  del(name) {
    delete this.stacks[name];
  }
}