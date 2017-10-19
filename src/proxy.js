module.exports = function ObjectProxy(object) {
  return new Proxy(object, {
    get(obj, key) {
      if (key in obj) {
        const parentData = obj[key];
        return typeof parentData === 'function'
          ? parentData.bind(obj)
          : parentData;
      } else {
        const childData = obj.conn[key];
        return typeof childData === 'function'
          ? childData.bind(obj.conn)
          : childData;
      }
    },
    set(obj, key, value) {
      if (key in obj.conn) {
        obj.conn[key] = value;
      } else {
        obj[key] = value;
      }
    }
  })
}