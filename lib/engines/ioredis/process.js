const CHECK = Symbol('YMER#REDIS#PROCESS#CHECK');

class MySQLProcess {
  constructor(ctx) {
    this.ctx = ctx;
    this.connection = null;
    this.multi = null;
    this.transacted = false;
  }

  get conn() {
    return this.transacted 
      ? this.multi 
      : this.connection;
  }

  async [CHECK](cb) {
    if (!this.connection) return;
    return await cb();
  }

  async hgetall(key) {
    const pipeline = await this.conn.hgetall(key);
    if (this.transacted) {
      if (!pipeline.exec) throw new Error(`错误的对象'hgetall: ${key}'`);
      return await new Promise((resolve, reject) => {
        pipeline.exec((err, result) => {
          if (err) return reject(err);
          resolve(result.slice(-1)[0]);
        });
      })
    }
    return pipeline;
  }

  async exists(key) {
    const pipeline = await this.conn.exists(key);
    if (this.transacted) {
      if (!pipeline.exec) throw new Error(`错误的对象'exists: ${key}'`);
      return await new Promise((resolve, reject) => {
        pipeline.exec((err, result) => {
          if (err) return reject(err);
          resolve(result.slice(-1)[0]);
        });
      })
    }
    return pipeline;
  }

  create(redis) {
    return async () => {
      if (!this.connection) {
        this.connection = this.ctx.pool;
      }
      return redis;
    }
  }

  async begin() {
    if (this.transacted) return;
    return await this[CHECK](async () => {
      this.multi = this.connection.multi();
      this.transacted = true;
    })
  }

  async commit() {
    if (!this.transacted) return;
    return await this[CHECK](async () => {
      return await new Promise((resolve, reject) => {
        this.conn.exec((err, result) => {
          this.transacted = false;
          if (err) return reject(err);
          resolve(result.slice(-1)[0]);
        })
      })
    })
  }

  rollback() {
    if (!this.transacted) return;
    this.transacted = false;
  }

  async release() {
    return await this[CHECK](async () => {
      return this.connection.disconnect();
    })
  }
}

module.exports = MySQLProcess;