const CHECK = Symbol('YMER#MYSQL#PROCESS#CHECK');

class MySQLProcess {
  constructor(ctx) {
    this.ctx = ctx;
    this.connection = null;
    this.transacted = false;
  }

  async [CHECK](cb) {
    if (!this.connection) return;
    return await cb();
  }

  create(mysql) {
    return async () => {
      if (!this.connection) {
        this.connection = await new Promise((resolve, reject) => {
          this.ctx.pool.getConnection((err, connection) => {
            if (err) return reject(err);
            resolve(connection);
          });
        });
      }
      return mysql;
    }
  }

  async exec(sql, ...args) {
    return await this[CHECK](async () => {
      return new Promise((resolve, reject) => {
        this.connection.query(sql, args, (err, rows) => {
          if ( err ) return reject(err);
          resolve(rows);
        })
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
    return await this.exec(sql, ...values);
  }

  async ['delete'](table, where, ...wheres){
    let sql = `DELETE FROM ${table}`, values = [];
    if ( where ){
        sql += ' WHERE ' + where;
        values = values.concat(wheres);
    }
    return await this.exec(sql, ...values);
  }

  async begin() {
    if (this.transacted) return;
    return await this[CHECK](async () => {
      return await new Promise((resolve, reject) => {
        this.connection.beginTransaction(err => {
          if (err) return reject(err);
          this.transacted = true;
          resolve();
        })
      })
    })
  }

  async release() {
    return await this[CHECK](async () => {
      this.connection.release();
    });
  }

  async commit() {
    if (!this.transacted) return;
    return await this[CHECK](async () => {
      return await new Promise((resolve, reject) => {
        this.connection.commit(err => {
          if (err) return reject(err);
          this.transacted = false;
          resolve();
        })
      })
    });
  }

  async rollback() {
    if (!this.transacted) return;
    return await this[CHECK](async () => {
      return await new Promise((resolve, reject) => {
        this.connection.rollback(err => {
          if (err) return reject(err);
          this.transacted = false;
          resolve();
        })
      });
    });
  }
}

module.exports = MySQLProcess;