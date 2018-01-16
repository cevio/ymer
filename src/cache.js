const util = require('./util');

module.exports = class Cache {
  constructor(yme) {
    this.yme = yme;
    this.cachePen = yme.pool.cache;
    this.urlPen = yme.pool.uri;
  }

  async expire(name, time) {
    if (time) {
      const redis = await this.yme.redis();
      await redis.expire(name, time / 1000);
    }
  }

  async remove(key, args) {
    const { domain, pathname } = util.formatCacheKey(key);
    const name = this.urlPen.select(domain, ...pathname).toString(args);
    const redis = await this.yme.redis();
    const exists = await redis.exists(name);

    if (exists) {
      await redis.del(name);
    }
  }

  async build(key, args, resource) {
    const { domain, pathname } = util.formatCacheKey(key);
    const name = this.urlPen.select(domain, ...pathname).toString(args);
    const ret = this.cachePen.get(key);

    if (ret) {
      const redis = await this.yme.redis();
      const result = await ret.fn(this.yme, args, resource);

      // 当数据为有效数据的时候
      if (util.isDef(result)) {
        // 当数据不存以下参数
        // 出现这种情况可能是由于直接拿的缓存数据来处理
        // 不被允许的数据结构
        if (!result.__Stringify__ && !result.__ArrayStringify__) {
          // 如果是对象类型
          if (typeof result === 'object') {
            // 如果是数组
            // 直接Stringify后存入
            if (Array.isArray(result)) {
              if (result.length) {
                await redis.hmset(name, {
                  __ArrayStringify__: true,
                  value: JSON.stringify(result)
                });
                await this.expire(name, ret.time);
              }
            }
            // 如果是JSON对象
            // 通过encode编码后存入
            else {
              if (Object.keys(result).length) {
                await redis.hmset(name, util.encode(result));
              } else {
                await redis.hmset(name, {});
              }
              await this.expire(name, ret.time);
            }
          }
          // 其余任何类型直接转化为字符串存入
          else {
            await redis.hmset(name, {
              __Stringify__: util.type(result),
              value: result
            });
            await this.expire(name, ret.time);
          }
        }
        return result;
      }
    }
  }

  async load(key, args) {
    const { domain, pathname } = util.formatCacheKey(key);
    const name = this.urlPen.select(domain, ...pathname).toString(args);
    const redis = await this.yme.redis();
    const exists = await redis.exists(name);

    if (exists) {
      let values = await redis.hgetall(name);
      if (values instanceof Multi) {
        values = await values.execAsync();
      }
      if (values.__Stringify__) {
        return util.parse(values.__Stringify__, values.value);
      } else if (values.__ArrayStringify__) {
        return JSON.parse(values.value);
      } else {
        return util.decode(values);
      }
    } else {
      return await this.build(key, args);
    }
  }
}