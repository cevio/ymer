const Ymer = require('./lib');
const fs = require('fs');

module.exports = async function(agent) {
  const app = agent.parent.parent;
  const config = agent.config;
  const ymer = new Ymer(config.widgets);
  agent.ymer = ymer;
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

  let mysqlStatus = true;
  let mysqlValue = 0;
  let mysqlLastCheckTime = null;
  let redisStatus = true;
  let redisLastCheckTime = null;

  const timer = setInterval(task, 1 * 60 * 1000);
  
  if (config.widgets.mysql) {
    app.health.add(async () => {
      return {
        key: 'mysql',
        value: mysqlStatus 
          ? { status: 'UP', count: mysqlValue, last_check_time: mysqlLastCheckTime } 
          : { status: 'OUT_OF_SERVICE', count: mysqlValue, last_check_time: mysqlLastCheckTime }
      }
    });
  }

  if (config.widgets.redis) {
    app.health.add(async () => {
      return {
        key: 'redis',
        value: redisStatus 
          ? { status: 'UP', last_check_time: redisLastCheckTime } 
          : { status: 'OUT_OF_SERVICE', last_check_time: redisLastCheckTime }
      }
    });
  }
  
  app.on('mounted', task);
  app.on('beforeDestroy', async () => {
    clearInterval(timer);
    await ymer.disconnect();
  });

  async function task() {
    await ymer.exec(async (yme) => {
      const time = new Date();

      if (config.widgets.mysql) {
        try {
          const mysql = await yme.mysql();
          const res = await mysql.exec(`select COUNT(table_name) AS Count from information_schema.tables where table_schema='${config.widgets.mysql.database}'`);
          mysqlValue = res[0].Count;
          mysqlStatus = true;
        } catch(e) { 
          mysqlStatus = false;
          mysqlValue = 0;
        }
        mysqlLastCheckTime = time;
      }
      
      if (config.widgets.redis) {
        try {
          const redis = await yme.redis();
          await redis.set(`${config.widgets.redis.name}:sys:alive`, time.getTime() + '');
          redisStatus = true;
        } catch(e) {
          redisStatus = false;
        }
        redisLastCheckTime = time;
      }
    });
  }
}