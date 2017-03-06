#!/usr/bin/env node
var fs = require("fs"),
    path = require("path"),
    http = require("http"),
    colorConsole = require("color-console"),
    minimist = require("minimist"),
    watch = require("node-watch"),
    open = require("open"),
    detect = require("detect-port"),
    connect = require("connect"),
    connectRouter = require("connect-route"),
    bodyParser = require("body-parser"),
    serveStatic = require("serve-static"),
    socket = require("socket.io"),
    inject = require("inject-html"),
    argv = require("minimist")(process.argv.slice(2)),
    dir = process.cwd(),
    cfgFile = path.join(dir, "static-server.config.js");

require("console.table");

//  帮助文档
var helps = [{
    name: "entry",
    valueType: "String",
    defaultVal: "index.html",
    mean: "首页的HTML文件名"
}, {
    name: "port",
    valueType: "Number",
    defaultVal: 3000,
    mean: "将要启动的端口"
}, {
    name: "auto-refresh",
    valueType: "Boolean",
    defaultVal: true,
    mean: "是否开启自动刷新"
}, {
    name: "watches",
    valueType: "Array/String",
    defaultVal: "当前目录",
    mean: "如开启了自动刷新,文件发生变化后将自动刷新页面"
}, {
    name: "ignores",
    valueType: "Array/String",
    defaultVal: '""',
    mean: "忽略目录,一般为node_modules或者jspm_packages之类的第三方包"
}, {
    name: "routers",
    valueType: "Array.<Object>",
    defaultVal: "[]",
    mean: "自定义路由,可写一些路由处理函数,模拟ajax请求响应"
}];

var app = connect(),
    cfg = {
        entry: "index.html",
        port: 3000,
        "auto-refresh": true,
        watches: dir,
        ignores: [],
        routers: []
    },
    ignores = [
        "node_modules",
        "jspm_packages",
        "bower_components"
    ],
    injectScript = inject({
        code: `
            <!--injected by static-server-->
            <script src="http://cdn.bootcss.com/socket.io/1.7.2/socket.io.min.js"></script>
            <script type="text/javascript">
                var socket = io.connect("/"),
                    doc = document,
                    head = doc.getElementsByTagName("head")[0],
                    links, cur, link, parent;
                socket.on("refresh-css", function() {
                    links = document.getElementsByTagName("link");
                    for(var i = 0, len = links.length; i < len; i ++) {
                        cur = links[i];
                        parent = cur.parentNode;
                        if (parent === null) {
                            parent = head;
                        }
                        if (cur.rel === "stylesheet" && cur.href.length) {
                            link = doc.createElement("link");
                            link.rel = "stylesheet";
                            link.href = cur.href + "?v=" + (new Date()).getTime();
                            parent.replaceChild(link, cur);
                        }
                    }
                });
                socket.on("refresh-page", function() {
                    location.reload();
                });
            </script>
            <!--injected by static-server end-->
        `
    }),
    outConfig, router;

//  帮助
if (argv.help) {
    console.log("\n");
    colorConsole.red("Usage:");
    console.table(helps);
    process.exit();
}

//  读取配置文件
try {
    outConfig = require(cfgFile);
    if (outConfig.watches.length) {
        if (typeof outConfig.watches === "string" && outConfig.watches.length) {
            outConfig.watches = path.join(dir, outConfig.watch);
        } else if (Array.isArray(outConfig.watches)) {
            outConfig.watches = outConfig.watches.map(function (src) {
                return path.join(dir, src);
            });
        }

        if (typeof outConfig.ignores === "string" && outConfig.ignores.length) {
            outConfig.ignores = path.join(dir, outConfig.ignores);
            if (ignores.indexOf(outConfig.ignores) === -1) {
                ignores = ignores.push(outConfig.ignores);
            }
            outConfig.ignores = ignores;
        } else if (Array.isArray(outConfig.ignores)) {
            outConfig.ignores = outConfig.ignores.filter(function(src) {
                return ignores.indexOf(src) === -1;
            }).concat(ignores);
        } else {
            outConfig.ignores = ignores;
        }

        if (Array.isArray(outConfig.routers) && outConfig.routers.length) {
            for (var i = 0, len = outConfig.routers.length; i < len; i++) {
                router = outConfig.routers[i];
                if (typeof router.url === "undefined") {
                    throw `必须在自定义路由项中指定请求路径, 指定项为: ${JSON.stringify(router)}`;
                }
                if (typeof router.handler !== "function") {
                    throw `路由处理函数必须为函数类型, 指定项为: ${JSON.stringify(router)}`;
                }
                router.method = router.method || "get";
                outConfig.routers[i].method = router.method.toLowerCase();
            }
        }
    }
    cfg = merge(cfg, outConfig);
} catch (e) {
    if (e && e.code !== "MODULE_NOT_FOUND") {
        throw e;
    } else {
        cfg.ignores = ignores;
    }
}

//  检测端口是否可用
detect(cfg.port, function (ex, _port) {
    if (cfg.port === _port) {
        colorConsole.green(`将监听端口: ${_port}`);
    } else {
        colorConsole.green(`端口${cfg.port}被占用,将监听端口: ${_port}`);
        cfg.port = _port;
    }

    //  启服务
    statrServer(cfg);
});

/**
 * 启动服务
 * @param   cfg     配置项
 */
function statrServer(cfg) {
    var url = `http://127.0.0.1:${cfg.port}`,
        pathInfo, htmlStream, server, io;
    app.use(function (req, res, next) {
        res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Allow", "GET,PUT,POST,DELETE");
        res.setHeader("charset", "utf-8");

        pathInfo = req.url;
        //  处理HTML格式的
        if (pathInfo === "/" || /\.html?/.test(pathInfo)) {
            //  处理"/"的情况
            if (pathInfo === "/") {
                pathInfo = cfg.entry;
            }
            try {
                pathInfo = path.join(dir, pathInfo);
                htmlStream = fs.readFileSync(pathInfo, {
                    encoding: "utf8",
                    flag: "r"
                });
                if (isFullyHtml(htmlStream)) {
                    injectScript(req, res, function () {
                        res.setHeader("Content-Type", "text/html; charset=utf-8");
                        res.statusCode = 200;
                        res.end(htmlStream);
                    });
                } else {
                    next();
                }
            } catch (e) {
                next();
            }
        } else {
            next();
        }
    })
        .use(bodyParser.urlencoded({
            extended: false
        }))
        .use(serveStatic(dir, {
            "index": ["index.html"]
        }))
        .use(connectRouter(function (route) {
            if (cfg.routers.length) {
                cfg.routers.forEach(function (routerItem) {
                    route[routerItem.method](routerItem.url, routerItem.handler);
                });
            }
        }));

    //  监听相关端口启动服务
    server = http.createServer(app).listen(cfg.port, function (req, res) {
        colorConsole.green(`服务启动成功, 访问地址为: ${url}`);
        colorConsole.green("正在打开浏览器....");
        open(url);
    });

    io = socket.listen(server);
    io.on("connect", function (socket) {
        colorConsole.green("websocket握手成功, 将监视文件变化...");
        socket.emit("success");

        if (cfg.watches.length) {
            watch(cfg.watches, { 
                recursive: false,
                filter: function(filename) {
                    return cfg.ignores.every(function(name) {
                        return filename.indexOf(name) === -1;
                    });
                }
            }).on("change", function (file) {
                if (cfg["auto-refresh"]) {
                    if (/\.css$/.test(file)) {
                        colorConsole.green(`${file}发生变化, 刷新样式...`);
                        io.emit("refresh-css");
                    } else {
                        colorConsole.green(`${file}发生变化, 刷新页面...`);
                        io.emit("refresh-page");
                    }
                }
            });
        }
    });
}

/**
 * 合并对象
 * @param obj1
 * @param obj2
 * @returns {object}
 */
function merge(obj1, obj2) {
    for (var i in obj2) {
        obj1[i] = obj2[i];
    }
    return obj1;
}

/**
 * 判断字符串是否为完整的HTML字符串(<!doctype ...>开头, 包含html、head/body)
 * @param    {String}   str     被判断的字符串
 * @return   {Boolean}
 */
function isFullyHtml(str) {
    if (!str && str.length === 0) {
        return false;
    }
    str = str.replace(/\t|\n/g, "").trim();
    return (/^\<\!doctype/i).test(str) &&
        (/<html\b[^>]*>/gi).test(str) && (/<\/html\b[^>]*>/gi).test(str) &&
        ((/<head\b[^>]*>/gi).test(str) && (/<\/head\b[^>]*>/gi).test(str) ||
        (/<body\b[^>]*>/gi).test(str) && (/<\/body\b[^>]*>/gi).test(str));
}
