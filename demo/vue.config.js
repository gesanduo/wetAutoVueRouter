let path = require('path');
// let VueAutoRoutePlugin = require('wet-auto-vue-router-webpack-plugin');
let VueAutoRoutePlugin = require('./server');

function resolve(_path) {
  return path.resolve(__dirname, _path);
}

module.exports = {
  chainWebpack(config) {
    config.plugin('VueAutoRoutePlugin').use(VueAutoRoutePlugin, [{
      entry: resolve('src/views/'),
      output: resolve('src/router/routes.js'),
      rootComponent: 'Login',
      ignoreDir:'common',
    }]);
  }
}