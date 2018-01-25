const context = require('./context');
const CacheProcess = require('./process');

class Cache {
  constructor(ctx, namespace) {
    this.ctx = ctx;
    this.stacks = {};
    this.namespace = namespace;
  }

  set(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('ymer set cache method must be a function.');
    }
    this.stacks[name] = {
      fn,
      ctx: new context(name, this)
    };
    return this.stacks[name].ctx;
  }

  get(name) {
    return this.stacks[name];
  }

  del(name) {
    delete this.stacks[name];
  }

  connect() {
    this.ctx.cache = this;
  }

  dispatch(thread) {
    thread.cache = new CacheProcess(thread, this);
  }
}

module.exports = Cache;