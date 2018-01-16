const ObjectProxy = require('./proxy');
const debug = require('debug')('POOL:MySQL');

class MySQL {
  constructor(conn) {
    this.conn = conn;
    this.transaction = false;
  }

  async exec(sql, ...args) {
    return new Promise((resolve, reject) => {
      this.conn.query(sql, args, (err, rows) => {
        if ( err ) return reject(err);
        resolve(rows);
      })
    })
  }

  async insert(table, data) {
    let isSingle = false;
    const result = [];

    if (!Array.isArray(data)) {
      data = [data];
      isSingle = true;
    }

    for (let i = 0; i < data.length; i++) {
      result.push(await this.exec(`INSERT INTO ${table} SET ?`, data[i]));
    }

    if (isSingle) {
      return result[0];
    }

    return result;
  }

  async update(table, value, where, ...wheres) {
    let fields = [], values = [];
    for ( let key in value ){
      fields.push(key + '=?');
      values.push(value[key]);
    }
    let sql = `UPDATE ${table} SET ${fields.join(',')}`;
    if ( where ){
      sql += ' WHERE ' + where;
      values = values.concat(wheres);
    }
    return await this.exec(sql, values);
  }

  async ['delete'](table, where, wheres){
    let sql = `DELETE FROM ${table}`, values = [];
    if ( where ){
        sql += ' WHERE ' + where;
        values = values.concat(wheres);
    }
    return await this.exec(sql, values);
  }

  async begin() {
    await new Promise((resolve, reject) => {
      this.conn.beginTransaction(err => {
        if (err) return reject(err);
        this.transaction = true;
        debug('MySQL begin transaction');
        resolve();
      })
    })
  }

  async commit() {
    if (!this.transaction) return;
    await new Promise((resolve, reject) => {
      this.conn.commit(err => {
        if (err) return reject(err);
        resolve();
      })
    })
  }

  async rollback() {
    if (!this.transaction) return;
    await new Promise((resolve, reject) => {
      this.conn.rollback(err => {
        if (err) return reject(err);
        resolve();
      })
    });
  }
}

module.exports = function MySQLProxy(conn) {
  const mysql = new MySQL(conn);
  return ObjectProxy(mysql);
}