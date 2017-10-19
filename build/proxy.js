'use strict';

module.exports = function ObjectProxy(object) {
  return new Proxy(object, {
    get: function get(obj, key) {
      if (key in obj) {
        var parentData = obj[key];
        return typeof parentData === 'function' ? parentData.bind(obj) : parentData;
      } else {
        var childData = obj.conn[key];
        return typeof childData === 'function' ? childData.bind(obj.conn) : childData;
      }
    },
    set: function set(obj, key, value) {
      if (key in obj.conn) {
        obj.conn[key] = value;
      } else {
        obj[key] = value;
      }
    }
  });
};