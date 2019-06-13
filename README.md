# wet-auto-vue-routes-webpack-plugin
根据指定目录自动生成 vue-router 配置


<h2 align="center">安装</h2>

```bash
  npm i --save-dev wet-auto-vue-routes-webpack-plugin
```

```bash
  yarn add --dev wet-auto-vue-routes-webpack-plugin
```

<h2 align="center">使用方法</h2>

插件会从指定入口遍历读取[.vue]文件并在指定目录输出一个 vue-router 配置文件。部分路由配置也可在组件内通过 [$$route] 属性声明。

目录示例

```
src
├── route
│   └── index.js
│   └── routes.js
├── views
    ├── Login.vue  
    ├── main
    │    ├── Index.vue
    │    ├── List.vue
    │    ├── subDir
    │    │   ├── Index.vue
    │    │   └── Order.vue
    │    │
    │    └── otherSubDir
    │
    ├── otherDir
    └── ...

```

**webpack.config.js**
```
vue-cli3.0的配置在vue.config.js
```
```js

let path = require('path');
let VueAutoRoutePlugin = require('wet-auto-vue-router-webpack-plugin');

function resolve(_path) {
  return path.resolve(__dirname, _path);
}

module.exports = {
  chainWebpack(config) {
    config.plugin('VueAutoRoutePlugin').use(VueAutoRoutePlugin, [{
      entry: resolve('src/views/'),
      output: resolve('src/router/routes.js'),
      rootComponent: 'Login.vue',
      ignoreDir:'common',
    }]);
  }
}

```
插件会在 [output] 目录下生成 [routes.js] 文件，大概像这样

**src/route/routes.js**
```js

export default [{"meta":null,"view":null,"_path":"E:\\work\\code\\mygit\\wetAutoVueRouter\\demo\\src\\views/About.vue",
"path":"/About","name":"About","component":()=> import('E:\\work\\code\\mygit\\wetAutoVueRouter\\demo\\src\\views/About.vue')
},
{"meta":null,"view":null,"_path":"E:\\work\\code\\mygit\\wetAutoVueRouter\\demo\\src\\views/Home.vue","path":"/Home","name":"Home",
"component":()=> import('E:\\work\\code\\mygit\\wetAutoVueRouter\\demo\\src\\views/Home.vue')
}
}]
```

然后你就可以直接使用这份配置了

**src/router/index.js**
```js

import Vue from 'vue'
import Router from 'vue-router'
// 引入插件生成的routes.js
import routes from './routes'

Vue.use(Router);

routes.push({
  path: '*',
  redirect: '/'
})

export default new Router({
  routes: routes
});

```

你还可以在 [.vue] 组件内定义路由的相关信息，但这也不是必须的，只有你需要时才这么做

```js

export default {
  name:'login',
  $$route:{ 
    name:'Login',
    meta:{
      label:'登录'
    }
  }

}

```

<h2 align="center">插件配置参数</h2>

|Name|Type|Default|Description|Required|
|:--:|:--:|:-----:|:----------|:--|
|**`entry`**|`{String}`|`无`|路由页面的入口路径|`Yes`|
|**`output`**|`{String}`|`无`|配置文件输出路径|`Yes`|
|**`rootComponent`**|`{String}`|`无`|根路由下的组件，也就是当路由为`/`时的页面，只在入口路径下的vue文件才行，也可以在$$route配置不要带有`.vue`后缀哦|`No`|
|**`ignoreDir`**|`{String}`|`components`|在插件遍历目录时，需要忽略的目录，如果有多个，请用','隔开|`No`|
|**`propsKeyName`**|`{String}`|`$$route`|组件内的路由配置key name,有需要可以更换|`No`|


<h2 align="center">【$$route】配置参数</h2>

```js

export default {
  // $$route 仅在需要的时候才配置，它并不是必须有的；
  // $$route 可以通过修改插件配置自定义keyName，必须是一个纯对象。
  $$route:{
    // 路由名称，同 vue-router 的 name；如果不给则默认取文件名前缀当name
    name:'Login',
    //同 vue-router 的 meta；
    meta:{
      label:'登录'
    },
    // 同 vue-router 的 path,不设置则默认为entry下路径 如main/list.vue 则为main/list
    path:'/',
    // 同 vue-router 的 redirect
    redirect:'/login',
    // 同 vue-router 的 alias
    alias:'',
  }

}


```

<h2 align="center">其他说明</h2>

- 注意事项：如果文件以_开头则默认生成/:这种路由，如detail/_id.vue的路由为path:'detail/:id',当然你也可以在$$route下定义path.
- 暂时不支持 `vue-router` 的 `命名视图` .
- 每次项目启动或有文件删除时，插件会遍历所有目录和文件。或者更新了vue文件的$$route的配置，则重新生成配置。
- 详细用法可以查看demo 。





