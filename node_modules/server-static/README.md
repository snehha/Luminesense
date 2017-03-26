# static-server

静态文件服务器,支持SPA,类似于[live-server](https://github.com/tapio/live-server),支持自定义ajax请求路径mock数据

### 安装

    npm install server-static -g

安装完成可通过运行

    static-server --help
    
命令查看配置帮助文档

通过在项目目录下运行

    static-server

的方式启动本服务


### 配置(如不指定,就用默认配置)

可以通过在项目根目录下新建名为"static-server.config.js"的文件进行配置

    //  static-server.config.js

    module.exports = {
    	port: 4000,             //  监听端口,默认3000,当端口被占用时随机
    	"auto-refresh": true,   //  文件发生变化时自动刷新
    	entry: "index.html",    //  首页文件,及当路径为"/"时响应的页面
    	watches: [              //  观察(文件/目录)数组,支持字符串或字符串数组,当为字符串时,只监听一个,文件发生变化,自动刷新页面
    		"lib",
    		"name",
    		"./index.html"
    	],
    	ignores: [              //  忽略数组,和watches传值类型一致,功能相反
    		"node_modules",
    		"jspm_packages",
    		"bower_components"
    	],
    	routers: [              //  自定义请求路由
    		{
    			url: "/main",                       //  路由
    			method: "GET",                      //  请求方式
    			handler: function(req, res, next) { //  改路由的处理函数(与connect模块调用方法一致)
    				console.log("请求进来了");
    				res.statusCode = 200;
    				res.end(JSON.stringify({
    					res: "test main"
    				}));
    			}
    		},
    		{
    			url: "/main2",
    			method: "POST",
    			handler: function(req, res, next) {
    				console.log(req.body);
    				res.statusCode = 200;
    				res.end(JSON.stringify({
    					tip: "请求内容",
    					res: req.body
    				}));
    			}
    		}
    	]
    };
    

### 开发初衷

先说说在工作中的痛楚吧:

- 在一些没有用到xxx-hot-reload之类的热加载插件的项目中,修改完文件需手动刷新浏览器查看效果

- ajax联调特别不方便,后端接口不允许跨域时只能用模拟json的形式来mock数据,这种方法值只能GET数据,无法模拟POST的情况(特别是遇到一些需要有分页功能的请求时)

- 可以通过自己写一些简单的处理逻辑来检查参数是否传对等

- 市面上大多数静态文件服务器不支持自定义路由的功能,mock数据也相对较麻烦


