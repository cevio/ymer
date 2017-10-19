const path = require('path');
const pathToRegExp = require('path-to-regexp');
const querystring = require('querystring');

class compress {
  constructor(obj, domain, compress) {
    this.obj = obj;
    this.domain = domain;
    this.compress = compress;
  }

  toString(args = {}, querys = {}) {
    let pathname = this.compress(args);
    const watcher = this.obj.getWatcher(this.domain);
    if (watcher) {
      pathname = watcher(pathname);
    }
    const domain = this.obj.getDomain(this.domain);
    const value = domain + pathname;
    const query = querystring.encode(querys);
    if (query) {
      return value + '?' + query;
    }
    return value;
  }
}

module.exports = class URI {
  constructor() {
    this._domains = {};
    this._pathes = {};
    this._watchers = {};
  }

  setDomain(key, value) {
    const that = this;
    this._domains[key] = value.replace(/\/$/, '');
    return {
      watch(cb) {
        that.setWatcher(key, cb);
      }
    }
  }

  getDomain(key) {
    return this._domains[key];
  }

  setPath(key, value) {
    this._pathes[key] = /^\//.test(value) 
      ? value 
      : '/' + value; 
  }

  getPath(...key) {
    key = key.map(k => {
      if (!this._pathes[k]) {
        throw new Error(`miss pathname: ${k}`);
      }
      return '.' + this._pathes[k];
    });
    return path.resolve('/', ...key);
  }

  setWatcher(domain, cb) {
    this._watchers[domain] = cb;
  }

  getWatcher(domain) {
    return this._watchers[domain];
  }

  select(domain, ...args) {
    const dist = this.getPath(...args);
    return new compress(this, domain, pathToRegExp.compile(dist));
  }
}