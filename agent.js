const Ymer = require('./lib');
const fs = require('fs');

module.exports = async function(agent) {
  const ymer = new Ymer(config);
  agent.ymer = ymer;
  agent.on('beforeDestroy', async () => await ymer.disconnect());
  await ymer.connect();

}