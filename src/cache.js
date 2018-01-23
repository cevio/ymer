const Multi = require('redis/lib/multi');
const util = require('./util');

module.exports = class Cache {
  constructor(yme) {
    this.yme = yme;
    this.cachePen = yme.pool.cache;
  }

  async expire(name, time) {
    if (time) {
      const redis = await this.yme.redis();
      await redis.expire(name, time / 1000);
    }
  }

  async delete(key, args = {}) {
    const { ctx } = this.cachePen.get(key);
    const pather = ctx.compile(args.args || {});
    const redis = await this.yme.redis();
    const exists = await this.compress(await redis.exists(pather));
    if (exists) await redis.del(pather);
  }

  async build(key, options = {}) {
    const { fn, ctx } = this.cachePen.get(key);
    const pather = ctx.compile(options.args || {});
    let resource = await fn(this.yme, options);

    if (typeof resource === 'function') {
      resource = await resource(ctx, this, pather);
    }

    if (util.isUnDef(resource)) {
      if (ctx.stringify && ctx.stringify.__defaultType__) {
        switch (ctx.stringify.__defaultType__) {
          case 'object': return {};
          case 'array': return [];
          case 'null': return null;
          default: return;
        }
      }
      return;
    }

    if (resource.__defineDataType__) {
      return resource.__defineDataValue__;
    }

    const type = util.type(resource);
    const data = ctx.toString(resource);

    const insertData = {
      __defineDataType__: type,
      __defineDataValue__: data
    }

    const redis = await this.yme.redis();
    await redis.hmset(pather, insertData);
    await this.expire(pather, ctx.expire_time);

    return resource;
  }

  async load(key, args = {}) {
    const { ctx } = this.cachePen.get(key);
    const pather = ctx.compile(args.args || {});
    const redis = await this.yme.redis();
    const exists = await this.compress(await redis.exists(pather));
    if (!exists) return await this.build(key, args);
    const values = await this.compress(await redis.hgetall(pather));
    return util.parse(values.__defineDataType__, values.__defineDataValue__);
  }

  async compress(values) {
    if (values instanceof Multi) {
      values = await new Promise((resolve, reject) => {
        values.exec_atomic((err, replies) => {
          if (err) return reject(err);
          resolve(replies[replies.length - 1]);
        });
      });
    }
    return values;
  }
}