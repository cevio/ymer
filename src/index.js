require('promise-redis')();
const MySQL = require('mysql');
const redis = require('redis');
const Redis = require('node-redis-connection-pool');
const SingleProcessPool = require('./pool');
const debug = require('debug')('YMER');
const CachePen = require('./cache-pen');

module.exports = class Ymer {
  constructor(options = {}) {
    this.cache = new CachePen(options.redis.name);
    this.redisPool = new Redis(options.redis);
    this.mysqlPool = MySQL.createPool(options.mysql);
    this.stacks = [];
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

  async create(next, options = {}) {
    const ctx = {};
    const mw = this.connect(options.name, options.error);
    await mw(ctx, next);
  }

  connect(name, error) {
    if (typeof name === 'function') {
      error = name;
      name = null;
    }

    return async (ctx, next) => {
      const yme = ctx[name || 'yme'] = this.createPool();
      let value;
      try{ 
        if (ctx.request && ctx.request.url) {
          debug('Url: %s', ctx.request.url);
        }
        debug('Start middleware go next()');
        value = await next(); 
        await yme.commit();
        debug('Try middleware success');
      }catch(e){
        await yme.rollback();
        if (typeof error === 'function') {
          error(ctx, e);
        }
        debug('Catch middleware runtime error', e);
        value = e;
      }finally{
        this.destroyPool(yme);
        debug('Finally runtime close');
      }
      return value;
    }
  }

  destroy() {
    this.mysqlPool.end();
    this.redisPool.drain();
    debug('Gloabl process exit');
  }
}