# ymer

一套功能强大的引擎管理和缓存管理框架。基于`mysql`+`redis`体系搭建，自动帮您管理您的引擎，无需担心引擎何时关闭的问题。

## Install

```bash
npm install ymer --save
```

## Usage

创建一个YMER对象容器

```javascript
const Ymer = require('ymer');
const ymer = new Ymer({
  mysql: {...options}, // see https://www.npmjs.com/package/mysql#pooling-connections
  redis: {...options}  // see https://www.npmjs.com/package/node-redis-connection-pool
})
```

## Koa

```javascript
const Koa = require('koa');
const app = new Koa();
app.use(ymer.connect((ctx, e) => {
  ctx.statusCode = 500;
  ctx.body = e.message;
}));
// ...
app.listen(3000);
```

### ymer.connect

Arguments:

- **name** `string` *默认：yme* ctx上会加载一个进程对象，名为`ctx.yme`，如果自定义为`process`，那么`ctx.process`。
- **errorHandle** `Function` *无默认函数* 错误处理函数。参数如下：
  - **ctx** 指koa进程对象的`ctx`
  - **e** 错误内容

之后你可以在你的中间件中使用`ctx.yme`了。

### Get MyQL Object

```javascript
const mysql = await ctx.yme.mysql();
```

启动事务处理

```javascript
await mysql.begin();
```

### Get Redis Object

```javascript
const redis = await ctx.yme.redis();
```

启动事务处理

```javascript
await redis.begin();
```

### Physical Rollback

```javascript
ctx.yme.catch(async () => {
  // ...
})
```

只要你在适当的位置定义这个函数，那么系统将自动帮您完成物理回滚。

## MySQL#exec

```javascript
const mysql = await ctx.yme.mysql();
const A = await mysql.exec('SELECT * FROM A');
const B = await mysql.exec('SELECT * FROM B WHERE a=? AND b=? AND c=?', [1, 2, 3]);
const C = await mysql.exec('SELECT * FROM B WHERE a=? AND b=? AND c=?', 1, 2, 3);
const D = await mysql.exec('SELECT * FROM B WHERE a=? AND b=? AND c=?', 1, [2, 3]);
```

## MySQL#insert

```javascript
const mysql = await ctx.yme.mysql();
const A = await mysql.insert('a'/*table*/, {
  a:1,
  b:2
}/*data*/);
const B = await mysql.insert('a', [
  { a: 1, b : 2 },
  { a: 3, b : 4 },
  { a: 5, b : 6 }
]);
```

## MySQL#update

```javascript
const mysql = await ctx.yme.mysql();
const A = await mysql.update('a', {
  a:1,
  b:2
}, 'id=?', [4]);
```

## MySQL#delete


```javascript
const mysql = await ctx.yme.mysql();
const A = await mysql.delete('a', 'id=?', [4]);
```

## URI

```javascript
const uri = ymer.uri;

uri.setDomain('redis', '/').watch(u => u.replace(/\//g, ':'));
uri.setPath('b', '/b');
uri.setPath('a', '/a/:id(\\d+)');
```

## Cache

Set Cache:

```javascript
const cache = ymer.cache;

cache.set('redis:b:a', 24 * 60 * 60 * 1000, async (mysql, args) => {
  return await mysql.exec('...', [args.id]);
});
```

use Cache:

在具体中间件中使用：

```javascript
const cache = ctx.yme.cache;
await cache.load('redis:b:a', { id: 4 });
await cache.build('redis:b:a', { id: 4 });
```

# License

[MIT](https://opensource.org/licenses/MIT)


