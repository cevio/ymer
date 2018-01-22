const pathToRegExp = require('path-to-regexp');
const fastJson = require('fast-json-stringify');

class context {
  constructor(pather) {
    this.path_callback = pathToRegExp.compile(pather);
    this.expire_time = 0;
  }

  compile(args = {}) {
    return this.path_callback(args).replace(/\//g, ':');
  }

  schema(options) {
    this.stringify = fastJson(options);
    return this;
  }

  toString(object) {
    if (this.stringify) {
      return this.stringify(object);
    }
  }

  expire(time) {
    this.expire_time = time || 0;
    return this;
  }
}

module.exports = class CachePen {
  constructor() {
    this.stacks = {};
  }

  set(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('ymer set cache method must be a function.');
    }
    fn.ctx = new context(name);
    this.stacks[name] = fn;
  }

  get(name) {
    return this.stacks[name];
  }

  del(name) {
    delete this.stacks[name];
  }
}