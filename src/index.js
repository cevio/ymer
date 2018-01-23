require('promise-redis')();
const MySQL = require('mysql');
const redis = require('redis');
const Redis = require('node-redis-connection-pool');
const SingleProcessPool = require('./pool');
const debug = require('debug')('YMER');
const CachePen = require('./cache-pen');
const compose = require('koa-compose');

const _MYSQL = require('./mysql');
const _REDIS = require('./redis');
const Cache = require('./cache');

module.exports = class Ymer {
  constructor(options = {}) {
    this.cache = new CachePen(options.redis.name);
    this.redisPool = new Redis(options.redis);
    this.mysqlPool = MySQL.createPool(options.mysql);
    this.stacks = [];
    this.options = options;
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

  async createSingleMysqlConnection() {
    return await new Promise((resolve, reject) => {
      const mysql = MySQL.createConnection(this.options.mysql);
      mysql.connect(err => {
        if (err) return reject(err);
        resolve(mysql);
      })
    })
  }
  
  async createSingleRedisConnection() {
    return await new Promise((resolve, reject) => {
      const _redis = redis.createClient(this.options.reids.redisOptions);
      _redis.on('ready', () => resolve(_reids));
      _redis.on('error', reject);
    })
  }

  async exec(next) {
    const ctx = { pool: this, stacks: [] };
    const mysql = async () => ctx._mysql = _MYSQL(await this.createSingleMysqlConnection());
    const redis = async () => ctx._redis = _REDIS(await this.createSingleRedisConnection());
    const cache = new Cache(ctx);

    ctx.mysql = mysql;
    ctx.redis = redis;
    ctx.cache = cache;
    ctx.catch = function(obj) { 
      ctx.stacks.push(obj);
    }

    try{ 
      await next(ctx);
      ctx._redis && await ctx._redis.commit();
      ctx._mysql && await ctx._mysql.commit();
    }catch(e){
      for (let i = 0; i < ctx.stacks.length; i++) await ctx.stacks[i]();
      ctx._mysql && await ctx._mysql.rollback();
    }finally{
      ctx._redis && ctx._redis.end();
      ctx._mysql && ctx._mysql.destroy();
    }
  }

  async create(ctx = {}, next, options = {}) {
    const mw = this.connect(options.name, options.error);
    const composeCallback = compose([mw, next]);
    await composeCallback(ctx);
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