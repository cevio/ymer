const Thread = require('./thread');
const MySQL = require('./engines/mysql');
const ReDis = require('./engines/ioredis');
const Cache = require('./engines/cache');
const CALL = Symbol('YMER#CALL');
class YMER {
  constructor(options = {}) {
    this.engines = {};
    this.options = options;
  }

  use(name, classic) {
    this.engines[name] = new classic(this, this.options[name] || {});
    return this;
  }

  async [CALL](name, ...args) {
    for (const engine in this.engines) {
      if (typeof this.engines[engine][name] === 'function') {
        await this.engines[engine][name](...args);
      }
    }
  }

  async connect() {
    await this[CALL]('connect');
  }

  async disconnect() {
    await this[CALL]('disconnect');
  }

  async exec(next, error) {
    const thread = new Thread(this);
    await this[CALL]('dispatch', thread);

    try {
      await next(thread);
      thread.call('commit');
    } catch (e) {
      await thread.off();
      thread.call('rollback');
      await error(e);
    } finally {
      thread.call('quit');
    }
    
  }

  middleware(error) {
    return async (ctx, next) => {
      await this.exec(async thread => {
        Object.defineProperty(ctx, 'yme', {
          get() {
            return thread;
          }
        });
        await next();
      }, err => error && error(err, ctx));
    }
  }
}

YMER.MySQL = MySQL;
YMER.Redis = ReDis;
YMER.Cache = Cache;
module.exports = YMER;