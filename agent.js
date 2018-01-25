const Ymer = require('./lib');
const fs = require('fs');

module.exports = async function(agent) {
  const ymer = new Ymer(config);
  agent.ymer = ymer;
  agent.on('beforeDestroy', async () => await ymer.disconnect());

  const config = agent.config;
  const keys = Object.keys(config);
  let i = keys.length;
  while (i--) {
    switch (keys[i]) {
      case 'mysql': ymer.use('mysql', Ymer.MySQL); break;
      case 'redis': ymer.use('mysql', Ymer.Redis); break;
      case 'cache': ymer.use('cache', Ymer.Cache); break;
      default:
        if (config[keys[i]] && config[keys[i]].basic) {
          ymer.use(keys[i], config[keys[i]].basic);
        }
    }
  }

  await ymer.connect();

}