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