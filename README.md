# 伊米尔（Ymer）

> 远古洪荒时代，太虚混沌世界的中间有一条宽大无底的的金伽侬裂缝，冷、热气，火焰、冰块、烟雾和蒸汽相互作用在裂缝边缘形成了壅堵化成了巨人伊米尔。伊米尔的后代奥丁、维利和威长大后杀死了伊米尔，用他的躯体形成了世界：血化成湖泊海洋；肉化为土地；骨头化为山；牙齿化为岩石；脑髓化为云；头盖骨化为天空；眉毛化为一道栅栏。

它是一套基于**mysql+redis**组合的进程池自动管理架构，同时提供方便的缓存和物理回滚操作。它的架构体现一种基于全局进程到子进程自动分配的思想，让用户不再关注引擎的创建与销毁的生命周期问题。

着眼于逻辑编写而非基础架构编写！

## Install

```bash
npm install ymer --save
```

## Usage

创建一个全局YMER对象进程，绑定在主进程中。我们使用的mysql进程池都是普通的mysql池，而redis则采用了npmjs上的一个包，虽然此包的star不多，但是完全看过源码觉得可行才引用过来的。所以可以放心使用：


```javascript
const Ymer = require('ymer');
const ymer = new Ymer({
  mysql: {...options}, // see https://www.npmjs.com/package/mysql#pooling-connections
  redis: {...options}  // see https://www.npmjs.com/package/node-redis-connection-pool
})
```

## Koa & ymer.connect

**YMER**与KOA连接。我们的思想是对主进程分配的用户自动分配子进程，采用中间件来提供API能力。

`ymer.connect`是一个中间件，接受两个个参数：

- **name** {String} 命名空间 默认：`yme` 即使用的时候`ctx.yme`获得。可忽略。
- **errorHandle** {Function} 自定义错误回调处理函数。
  - **ctx** 指koa进程对象的`ctx`
  - **e** 错误内容

```javascript
const Koa = require('koa');
const app = new Koa();
app.use(ymer.connect((ctx, e) => {
  ctx.statusCode = 500;
  ctx.body = e.message;
}));
app.use(async (ctx, next) => {
  console.log(ctx.yme);
  const mysql = await ctx.yme.mysql();
  await next();
});
// ...
app.listen(3000);
```

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

### Transacte rollback & Physical Rollback

- **事务回滚：** mysql提供事务处理，而redis并未提供，我们使用`redis.multi()`来模拟事务回滚。在程序中，如果出错，都将自动回滚这些引擎提供的事务。
- **物理回滚：** 比如说fs操作或者api操作，你需要保证在最终结构都没有任何错误，如果有错误需要还原到初始状态，那么物理回滚就非常使用。我们仅仅在处理过程中使用`ctx.yme.catch`函数来注册回滚代码。

```javascript
ctx.yme.catch(async () => {
  // ...
})
```

只要你在适当的位置定义这个函数，那么系统将自动帮您完成物理回滚。

## MySQL#exec

Mysql查询数据方法：

基础函数采用最原始的SQL语句查询。

```javascript
const mysql = await ctx.yme.mysql();
const A = await mysql.exec('SELECT * FROM A');
const B = await mysql.exec('SELECT * FROM B WHERE a=? AND b=? AND c=?', [1, 2, 3]);
const C = await mysql.exec('SELECT * FROM B WHERE a=? AND b=? AND c=?', 1, 2, 3);
const D = await mysql.exec('SELECT * FROM B WHERE a=? AND b=? AND c=?', 1, [2, 3]);
```

## MySQL#insert

MYSQL插入数据方法。

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

MYSQL更新数据方法。`mysql.update(table, data, where, args)`

```javascript
const mysql = await ctx.yme.mysql();
const A = await mysql.update('a', {
  a:1,
  b:2
}, 'id=?', [4]);
```

## MySQL#delete

MYSQL删除数据方法。`mysql.delete(table, where, args)`

```javascript
const mysql = await ctx.yme.mysql();
const A = await mysql.delete('a', 'id=?', [4]);
```

## URI

URI的存在具有一定的价值，特别在开发与线上周期性切换环境的时候能够特别明显的体现出它的优势。但是其优势不仅仅于此，还能够对于redis键名进行自动生成，体现键名与URL一致性的优势。

- **设置域名** `uri.setsetDomain(name, prefix)`
- **获取余名** `uri.getDomain(...args)`
- **观察域名** `uri.watch(name, cb)`
- **设置路径** `uri.setPath(...args)`
- **获取路径** `uri.getPath(...args)`

```javascript
const uri = ymer.uri;

uri.setDomain('redis', '/').watch(u => u.replace(/\//g, ':'));
uri.setPath('b', '/b');
uri.setPath('a', '/a/:id(\\d+)');
```

## Cache

基于Redis的缓存机制。理论上是这样运行的：

程序优先会redis的数据，如果数据不存在，那么我们会根据缓存生成规则从数据库中获取缓存后添加到redis中，然后再返回这个数据。

Set Cache:

`cache.set(name, expire, cb)`

- **name:** 缓存映射组合名，基于URI机制生成
- **expire:** 有效期，单位毫秒
- **cb:** 缓存生成函数
  - **yme:** yme用户进程对象
  - **args:** 参数
  - **resource:** 懒生成数据


```javascript
const cache = ymer.cache;

cache.set('redis:b:a', 24 * 60 * 60 * 1000, async (yme, args, resource) => {
  if (!resource) {
    const mysql = await yme.mysql();
    resource = await mysql.exec('...', [args.id]);
  }
  return resource;
});
```

use Cache:

在具体中间件中使用：

```javascript
const cache = ctx.yme.cache;
await cache.load('redis:b:a', { id: 4 });
await cache.build('redis:b:a', { id: 4 }, {a:1});
```

# License

[MIT](https://opensource.org/licenses/MIT)


