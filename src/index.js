require('promise-redis')();
const MySQL = require('mysql');
const redis = require('redis');
const Uri = require('./uri');
const Redis = require('node-redis-connection-pool');
const SingleProcessPool = require('./pool');
const debug = require('debug')('YMER');

class CachePen {
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

module.exports = class Ymer {
  constructor(options = {}) {
    this.cache = new CachePen();
    this.uri = new Uri();
    this.redisPool = new Redis(options.redis);
    this.mysqlPool = MySQL.createPool(options.mysql);
    this.stacks = [];
    process.on('SIGINT', () => {
      this.destroy();
      process.exit(0);
    });
  }

  get length() {
    return this.stacks.length;
  }

  createPool() {
    const single = new SingleProcessPool(this);
    this.stacks.push(single);
    debug('--------------------------------------');
    debug('Create a new process for current user.');
    return single;
  }

  destroyPool(pool) {
    const index = this.stacks.indexOf(pool);
    if (~index) {
      this.stacks[index].release();
      this.stacks.splice(index, 1);
      debug('Destroy the process for user');
    }
  }

  connect(name, error) {
    if (typeof name === 'function') {
      error = name;
      name = null;
    }

    return async (ctx, next) => {
      const yme = ctx[name || 'yme'] = this.createPool();
      try{ 
        debug('Url: %s', ctx.request.url);
        debug('Start middleware go next()');
        await next(); 
        await yme.commit();
        debug('Try middleware success');
      }catch(e){
        await yme.rollback();
        if (typeof error === 'function') {
          error(ctx, e);
        }
        debug('Catch middleware runtime error', e);
      }finally{
        this.destroyPool(yme);
        debug('Finally runtime close');
      }
    }
  }

  destroy() {
    this.mysqlPool.end();
    this.redisPool.drain();
    debug('Gloabl process exit');
  }
}