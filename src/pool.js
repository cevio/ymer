const MySQL = require('./mysql');
const Redis = require('./redis');
const Cache = require('./cache');
const debug = require('debug')('POOL');

module.exports = class SingleProcessPool {
  constructor(pool) {
    this.pool = pool;
    this.uri = pool.uri;
    this._mysql = null;
    this._redis = null;
    this.cache = new Cache(this);
    this.stacks = [];
    this.nexts = [];
  }

  ['catch'](obj) { 
    this.stacks.push(obj); 
    debug('Push an stack to this.stacks');
  }

  next(cb) {
    this.afters.push(cb);   
  }

  async done() {
    for (let i = 0; i < this.nexts.length; i++) {
      if (typeof this.nexts[i] === 'function') {
        await this.nexts[i]();
      }
    }
  }

  release() {
    if (this._mysql) {
      this._mysql.release();
      debug('Release mysql object to mysql pool');
    }
    if (this._redis) {
      this.pool.redisPool.release(this._redis.object);
      debug('Release redis object to redis pool');
    }
  }

  async mysql() {
    if (this._mysql) return this._mysql;
    return this._mysql = await new Promise((resolve, reject) => {
      this.pool.mysqlPool.getConnection((err, conn) => {
        if (err) return reject(err);
        debug('Get single mysql object from mysql pool');
        resolve(MySQL(conn));
      })
    });
  }

  async redis(...args) {
    if (this._redis) return this._redis;
    debug('Get single redis object from redis pool');
    return this._redis = Redis(await this.pool.redisPool.acquire(...args));
  }

  async commit() {
    if (this._redis) {
      await this._redis.commit();
      debug('Commit redis data');
    }
    if (this._mysql) {
      await this._mysql.commit();
      debug('Commit mysql data');
    }
    await this.done();
  }

  async rollback() {
    for (let i = 0; i < this.stacks.length; i++) {
      await this.stacks[i]();
      debug('Rollback stacks data');
    }
    if (this._mysql) {
      await this._mysql.rollback();
      debug('Rollback mysql data');
    }
  }
}