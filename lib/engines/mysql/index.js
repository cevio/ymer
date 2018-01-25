const MYSQL = require('mysql');
const MySQLProcess = require('./process');
const ProxyTo = require('../../proxy');

class MySQL {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.options = options;
    this.pool = null;
  }

  connect() {
    this.pool = MYSQL.createPool(this.options);
  }

  disconnect() {
    this.pool.end();
  }

  dispatch(thread) {
    const mysql = ProxyTo(
      new MySQLProcess(this), 
      'connection'
    );
    thread.mysql = mysql.create(mysql);
    thread.on('commit', async () => await mysql.commit());
    thread.on('rollback', async () => await mysql.rollback());
    thread.on('quit', () => mysql.release());
  }
}

module.exports = MySQL;