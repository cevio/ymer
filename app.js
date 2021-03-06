const Ymer = require('./lib');
const fs = require('fs');

module.exports = async function(app, config) {
  const ymer = new Ymer(config.widgets);

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

  if (config.widgets) {
    const keys = Object.keys(config.widgets);
    let i = keys.length;
    while (i--) {
      switch (keys[i]) {
        case 'mysql': ymer.use('mysql', Ymer.MySQL); break;
        case 'redis': ymer.use('redis', Ymer.Redis); break;
        case 'cache': ymer.use('cache', Ymer.Cache); break;
        default:
          if (config.widgets[keys[i]] && config.widgets[keys[i]].basic) {
            ymer.use(keys[i], config.widgets[keys[i]].basic);
          }
      }
    }
  }
  
  await ymer.connect();

  app.on('beforeDestroy', async () => await app.ymer.disconnect());

  app.preload(() => {
    app.middleware.ymer = async (ctx, next) => {
      const middleware = ymer.middleware(config.error || ((e, ctx) => {
        app.console.error(e);
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