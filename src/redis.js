const ObjectProxy = require('./proxy');
const debug = require('debug')('POOL:MySQL');

class Redis {
  constructor(conn) {
    this.object = conn;
    this.conn = conn;
    this.transaction = false;
  }

  async begin() {
    this.conn = this.object.multi();
    this.transaction = true;
    debug('Redis begin transaction')
  }

  async commit() {
    if (!this.transaction) return;
    return await new Promise((resolve, reject) => {
      this.conn.exec((err, replies) => {
        if (err) return reject(err);
        resolve(replies);
      })
    })
  }
}

module.exports = function MySQLProxy(conn) {
  const mysql = new Redis(conn);
  return ObjectProxy(mysql);
}