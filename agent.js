const Ymer = require('./lib');
const fs = require('fs');

module.exports = async function(agent) {
  const config = agent.config;
  const ymer = new Ymer(config.widgets);
  agent.ymer = ymer;
  agent.on('beforeDestroy', async () => await ymer.disconnect());
  if (config.widgets) {
    const keys = Object.keys(config.widgets);
    let i = keys.length;
    while (i--) {
      switch (keys[i]) {
        case 'mysql': ymer.use('mysql', Ymer.MySQL); break;
        case 'redis': ymer.use('mysql', Ymer.Redis); break;
        case 'cache': ymer.use('cache', Ymer.Cache); break;
        default:
          if (config.widgets[keys[i]] && config.widgets[keys[i]].basic) {
            ymer.use(keys[i], config.widgets[keys[i]].basic);
          }
      }
    }
  }

  await ymer.connect();

}