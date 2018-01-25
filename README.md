# 伊米尔（Ymer）

> 远古洪荒时代，太虚混沌世界的中间有一条宽大无底的的金伽侬裂缝，冷、热气，火焰、冰块、烟雾和蒸汽相互作用在裂缝边缘形成了壅堵化成了巨人伊米尔。伊米尔的后代奥丁、维利和威长大后杀死了伊米尔，用他的躯体形成了世界：血化成湖泊海洋；肉化为土地；骨头化为山；牙齿化为岩石；脑髓化为云；头盖骨化为天空；眉毛化为一道栅栏。

它是一套基于**mysql+redis**组合的进程池自动管理架构，同时提供方便的缓存和物理回滚操作。它的架构体现一种基于全局进程到子进程自动分配的思想，让用户不再关注引擎的创建与销毁的生命周期问题。

着眼于逻辑编写而非基础架构编写！

## Install

```bash
npm install ymer --save
```

## Usage

创建一个全局YMER对象进程，绑定在主进程中。

```javascript
const Ymer = require('ymer');
const ymer = new Ymer({
  mysql: {...options}, // see https://www.npmjs.com/package/mysql#pooling-connections
  redis: {...options}  // see https://www.npmjs.com/package/node-redis-connection-pool
})
```

## Use Plugins

```javascript
ymer.use('mysql', Ymer.MySql);
ymer.use('redis', Ymer.Redis);
ymer.use('cache', Ymer.Cache);
```

## Use MySQL

```javascript
const mysql = await ctx.yme.mysql();
await mysql.begin();
await mysql.exec('select * from a where a=?', 1);
await mysql.insert(table, data); // data: array or json
await mysql.update(table, data, where, wheres);
await mysql.delete(table, where, wheres);
await mysql.commit();
await mysql.rollback();
await mysql.release();
```

## Use Redis

```javascript
const redis = await ctx.yme.redis();
await redis.begin();
await redis.set 
await redis.get
await redis.exists 
await redis.expire
await redis.hmset
await redis.hgetall
...
await redis.commit();
await redis.rollback();
await redis.release();
```

## Use Cache

set cache

```javascript
const cache = ymer.cache;
cache.set(name, cb).expire(time).schema(rule);
```

use in process

```javascript
const cache = ctx.yme.cache;
await cache.load(key, args);
await cache.build(key, args);
await cache.delete(key, args);
```

## Connect to Nodebase

plugins.config.js

```javascript
{
  ymer: {
    mysql: {},
    redis: {}
  }
}
```

plugins.js

```javascript
{
  ymer: {
    enable: true,
    package: 'ymer'
  }
}
```