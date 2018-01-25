const util = require('./util');
const pathToRegExp = require('path-to-regexp');

module.exports = class Cache {
  constructor(yme, cache) {
    this.yme = yme;
    this.cache = cache;
  }

  async expire(name, time) {
    if (time) {
      const redis = await this.yme.redis();
      await redis.expire(name, time / 1000);
    }
  }

  async delete(key, args = {}) {
    const { ctx } = this.cache.get(key);
    const pather = ctx.compile(args.args ? args.args : args);
    const redis = await this.yme.redis();
    const exists = await redis.exists(pather);
    if (exists) await redis.del(pather);
  }

  async build(key, options = {}) {
    const { fn, ctx } = this.cache.get(key);
    const pather = ctx.compile(options.args ? options.args : options);
    let resource = await fn(this.yme, options, pather);

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
    const { ctx } = this.cache.get(key);
    const pather = ctx.compile(args.args ? args.args : args);
    const redis = await this.yme.redis();
    const exists = await redis.exists(pather);
    if (!exists) return await this.build(key, args);
    const values = await redis.hgetall(pather);
    return util.parse(values.__defineDataType__, values.__defineDataValue__);
  }
}