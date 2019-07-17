const path = require('path');
const fs = require('fs');
const glob = require('glob');
// let VueAutoRoutePlugin = require('wet-auto-vue-router-webpack-plugin');
let VueAutoRoutePlugin = require('./server');

function resolve(_path) {
  return path.resolve(__dirname, _path);
}
// 多页面生成配置
function getPages(dir='src/modules/*/*.js'){
  const entires = glob.sync(dir);
  let pages = {};
  entires.map((item)=>{
    const fileSplit = item.split('/');
    const pageName = fileSplit[2];
    let pageHtml = fileSplit.slice(0, 3).join('/') + '/index.html'
    pages[pageName] = {
      entry: item,
      template: pageHtml,
      filename: `${pageName}.html`
    }
  })
  return pages;
}
module.exports = {
  pages:getPages(),
  chainWebpack(config) {
    config.plugin('VueAutoRoutePlugin').use(VueAutoRoutePlugin, [{
      entry: resolve('src/modules/'),
      vueOfEntry:'views/',
      output:'router/routes.js',
      rootComponent: 'Login',
      ignoreDir:'common',
    }]);
  }
}