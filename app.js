const Ymer = require('./lib');
const fs = require('fs');

module.exports = async function(app, config) {
  const ymer = new Ymer(config);

  class Cache extends app.nodebase.Basic {
    constructor(ctx) {
      super(ctx);
      this.type = 'cache';
    }
  
    get service() {
      return this.base.service;
    }
  }

  app.nodebase.Cache = Cache;
  app.ymer = ymer;

  const keys = Object.keys(config);
  let i = keys.length;
  while (i--) {
    switch (keys[i]) {
      case 'mysql': ymer.use('mysql', Ymer.MySQL); break;
      case 'redis': ymer.use('mysql', Ymer.Redis); break;
      case 'cache': ymer.use('cache', Ymer.Cache); break;
      default:
        if (config[keys[i]] && config[keys[i]].classic) {
          ymer.use(keys[i], config[keys[i]].classic);
        }
    }
  }
  
  app.on('app:beforeServerStart', async () => await ymer.connect());
  app.on('beforeDestroy', async () => await app.ymer.disconnect());

  app.preload(() => {
    app.middleware.ymer = async (ctx, next) => {
      const middleware = ymer.middleware(config.error || ((e, ctx) => {
        ctx.status = 500;
        ctx.body = e.stack;
      }));
      await middleware(ctx, next);
    }
  });

  app.preload(() => {
    if (!config.cache) config.cache = 'app/cache';
    config.cache = app.resolve(config.cache);
    app.loadModules(config.cache, 'cache', Cache, app);
  });

  app.preload(() => {
    const file = app.resolve(config.caches || 'app/caches.js');
    if (fs.existsSync(file)) {
      const exports = app.utils.loadFile(file);
      if (typeof exports === 'function') {
        exports(app, ymer.cache);
      }
    }
  });
}