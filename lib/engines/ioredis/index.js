const REDIS = require('ioredis');
const RedisProcess = require('./process');
const ProxyTo = require('../../proxy');

class ReDis {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.options = options;
    this.pool = null;
  }

  formatReidsClusterString(str) {
    const pools = str.split(',');
    return pools.map(pool => {
      const detal = pool.split(':');
      return {
        port: Number(detal[1]),
        host: detal[0]
      }
    });
  }

  connect() {
    this.pool = new REDIS.Cluster(
      this.formatReidsClusterString(this.options.cluster), 
      this.options.options || {}
    );
  }

  async disconnect() {
    await this.pool.quit();
  }

  dispatch(thread) {
    const redis = ProxyTo(
      new RedisProcess(this), 
      'conn'
    );
    thread.redis = redis.create(redis);
    thread.on('commit', async () => await redis.commit());
    thread.on('rollback', async () => await redis.rollback());
    thread.on('quit', () => redis.release());
  }
}

module.exports = ReDis;