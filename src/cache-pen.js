const pathToRegExp = require('path-to-regexp');
const fastJson = require('fast-json-stringify');

class context {
  constructor(pather, parent) {
    this.path_callback = pathToRegExp.compile(pather);
    this.expire_time = 0;
    this.parent = parent;
  }

  compile(args = {}) {
    const pather = this.path_callback(args).replace(/\//g, ':');
    return this.parent.namespace + pather;
  }

  schema(options) {
    this.stringify = fastJson(options);
    this.stringify.__defaultType__ = options.type;
    return this;
  }

  toString(object) {
    if (this.stringify) {
      return this.stringify(object);
    } else {
      return JSON.stringify(object);
    }
  }

  expire(time) {
    this.expire_time = time || 0;
    return this;
  }
}

module.exports = class CachePen {
  constructor(namespace) {
    this.stacks = {};
    this.namespace = namespace;
  }

  set(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error('ymer set cache method must be a function.');
    }
    this.stacks[name] = {
      fn,
      ctx: new context(name, this)
    };
    return this.stacks[name].ctx;
  }

  get(name) {
    return this.stacks[name];
  }

  del(name) {
    delete this.stacks[name];
  }
}