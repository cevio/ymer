module.exports = function ObjectProxy(object, name) {
  return new Proxy(object, {
    get(obj, key) {
      if (key in obj) {
        const parentData = obj[key];
        return typeof parentData === 'function'
          ? parentData.bind(obj)
          : parentData;
      } else {
        const childData = obj[name][key];
        return typeof childData === 'function'
          ? childData.bind(obj[name])
          : childData;
      }
    },
    set(obj, key, value) {
      if (key in obj[name]) {
        obj[name][key] = value;
      } else {
        obj[key] = value;
      }
    }
  })
}