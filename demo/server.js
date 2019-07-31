const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const {
  parse
} = require('@vue/component-compiler-utils');
const vueCompiler = require('vue-template-compiler'); // 用来获取vue文件中的配置，获取$$route
const diff = require('deep-diff').diff;

class WetAutoVueRouter {
  // 初始化参数
  constructor(config){
    const defaultConfig = {
      rootComponent: '',
      ignoreDir: 'components',
      propsKeyName: '$$route'
    };
    this.routes = []; // 路由配置
    this.files = {}; // 保存vue文件的$$route的配置
    this.metaOutput = {
      warnings: [],
      errors: []
    };
    this.config = {...defaultConfig, ...config};
  }
  // webpack插件必须提供的方法
  apply(compiler){
    this._hook(compiler, 'emit', 'emit', (compilation, cb) => {
      compilation.errors = compilation.errors.concat(this.metaOutput.errors.map(x => '[webpack-auto-vue-router] ' + x));
      compilation.warnings = compilation.warnings.concat(this.metaOutput.warnings.map(x => '[webpack-auto-vue-router] ' + x));
      cb && cb();
    });
    this._hook(compiler, 'done', 'done', (compilation, cb) => {
      if (!this.watcher) {
        // 检测文件变化
        this.watcher = chokidar.watch(this.config.entry, {
          ignoreInitial: true
        });
        let changeCb = this._fileChanged.bind(this);
        let removeCb = this._fileRmoved.bind(this);
        this.watcher.on('add', changeCb).on('change', changeCb).on('unlink', removeCb);
      }
      cb && cb();
    })
    this.start();
  }
  _fileChanged(file) {
    let path = file.replace(this.config.entry, '');
    // 如果不是ignore文件夹变化 则执行
    if (path.indexOf(this.config.ignoreDir + '/') != -1) {
      return;
    }
    this._isVue(file) && this._diffConfig(file);
  }

  _fileRmoved(file) {
    (this._isVue(file) || this._isDirectory(file)) && this.start();
  }

  _hook(compiler, v3Name, v4Name, cb) {
    if (compiler.hooks && compiler.hooks[v4Name]) {
      compiler.hooks[v4Name].tap('WetAutoVueRouter', cb);
    } else {
      compiler.plugin(v3Name, cb);
    }
  }
  // 是否为vue文件
  _isVue(path){
    return /.vue/.test(path);
  }
  // 判断是否为文件夹
  isDir(path){  
    return fs.statSync(path) && fs.statSync(path).isDirectory();
  }
  start(){
    this.routes = []; // 初始化路由配置
    this.files = {};
    let entries = fs.readdirSync(this.config.entry);
    entries.map(item=>{
      // 判断文件夹是否存在，或者是否忽略
      fs.exists(`${this.config.entry}/${item}/${this.config.vueOfEntry}`,(res)=>{
        if(res && this.config.ignoreDir.indexOf(item)===-1){
          console.log(`${this.config.entry}/${item}/${this.config.vueOfEntry}`);
          this.getRoutesByDir(`${this.config.entry}/${item}/${this.config.vueOfEntry}`);
          this.output(`${this.config.entry}/${item}`);
        }
      })
      
    });
  }
  // 生成routes
  getRoutesByDir(dir=this.config.entry,nowDir=''){
    let list = fs.readdirSync(dir);// 获取当前路径下的文件
    list.map((item,index)=>{ // 遍历递归把非ignore跟vue的文件生成一个初步的router对象
      if(this.config.ignoreDir.indexOf(item)===-1){
        let route = {};
        if(this.isDir(`${dir}/${item}`)){ // 文件夹则递归里面的vue文件
          const newDir = `${nowDir}/${item}`;
          this.getRoutesByDir(`${dir}/${item}`,newDir);
        }else if(this._isVue(item)){
          route = this.getOneRoute(item,nowDir,`${dir}/${item}`);
          this.routes.push(route);
        }
      }
    })
  }
  // 生成一个router对象
  getOneRoute(fileName,dir,fullpath){
    let name = fileName;
    let route;
    name = fileName.split('.')[0];
    route = this.parseRouteConfig(fullpath); // 获取路由配置
    this.files[`${this.config.entry}${dir}/${fileName}`] = route;
    if(!route.path){ // 如果本身没有配置path则根据文件路径生成路由，如果文件名以_开头，就生成/:这种路由，比如detail/_id.vue路由就是detail/:id
      if(name.indexOf('_')===0){
        route.path = `${dir}/:${name.slice(1)}`;
      }else if(`${dir}/${name}`!==`/${this.config.rootComponent}`){
        route.path = `${dir}/${name}`;
      }else{
        route.path = '/';
      }
    }
    if(!route.name){
      route.name = name;
    }
    if(!route.chunk){ 
      route.chunk = route.name;
    }
    route.component = `()=> import(/* webpackChunkName: ${route.chunk} */ '${fullpath}')`
    return route;
  }
  // 判断修改的vue文件有没有修改$$route属性
  _diffConfig(file) {
    let config = this.parseRouteConfig(file);
    let _config = this.files[file];
    if (_config) {
      let hasDiff = diff(_config, config);
      if (hasDiff) {
        this.files[file] = config;
        this.start();
      };
    } else {
      this.files[file] = config;
      this.start();
    }
  }
  // 获取vue文件的route的配置
  parseRouteConfig(filePath) {
    const descriptor = parse({
      source: fs.readFileSync(filePath, {
        encoding: 'utf8'
      }),
      compiler: vueCompiler,
      filename: path.basename(filePath)
    });
    let route;
    let _config = { // 默认参数
      meta: null, // 路由元元素
      view: null, //
      _path: filePath
    };
    // vue文件是否有script内容
    let script = descriptor.script ? descriptor.script.content : null;
    if (script) {
      // 去掉注释
      script = script.replace(/\/\/[\S\s]+?[\r\n]/g, '').replace(/\/\*[\s\S]+?\*\//g, '');
      // 获取里面的router配置
      route = this.parseRoute(script);
      if (route) {
        try {
          // 生成route对象
          route = new Function(`return ${route.replace(/[\r\n]+/g,'')}`)();
          route = {..._config,...route};
          
        } catch (error) {
          throw new Error(error);
        }
      } else {
        route = _config;
      }
    } else {
      route = _config;
    }
    return route;
  }
  parseRoute(txt) {
    let data = txt;
    let mark = '$$route:'; //获取字段名
    let chart1 = '{';
    let chart2 = '}';
    let startIndex = data.indexOf(mark);
    let count = 0;
    let begingIndex;
    let endingIndex;
    if (startIndex === -1) {
      return '';
    }
    // 获取该字段的配置
    for (let i = startIndex; i < data.length; i++) {
      let w = data.charAt(i);
      if (w === chart1) {
        if (count === 0) begingIndex = i;
        ++count;
      } else if (w === chart2) {
        --count;
        if (count === 0) {
          endingIndex = i + 1;
          break;
        }
      }
    }
    return endingIndex ? data.slice(begingIndex, endingIndex) : '';
  }
  // 输出文件
  output(dir){
    let str = JSON.stringify(this.routes);
    str = str.replace(/"(\(\)=> import.*?vue'\))"/g,'$1\n');
    str = str.replace(/webpackChunkName: (.*)?\*/g,'webpackChunkName: "$1" *');
    fs.writeFileSync(`${dir}/${this.config.output}`, `export default ${str}`);
  }
}

module.exports = WetAutoVueRouter;