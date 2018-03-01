const Ymer = require('./lib');
const fs = require('fs');

module.exports = async function(agent) {
  const config = agent.config;
  const ymer = new Ymer(config.widgets);
  agent.ymer = ymer;
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
  
  let mysqlStatus = true;

  const timer = setInterval(() => {
    ymer.exec(async (yme) => {
      const mysql = await yme.mysql();
      await mysql.exec(`select COUNT(table_name) from information_schema.tables where table_schema='${config.widgets.mysql.database}'`);
      mysqlStatus = true;
    }, async () => mysqlStatus = false);
  }, 1 * 60 * 1000);
  
  agent.health.add(async () => {
    return {
      key: 'mysql',
      value: mysqlStatus ? { status: 'UP' } : { status: 'OUT_OF_SERVICE' }
    }
  });

  agent.on('beforeDestroy', async () => {
    clearInterval(timer);
    await ymer.disconnect();
  });
}