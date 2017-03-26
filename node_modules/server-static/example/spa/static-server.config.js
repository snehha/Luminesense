module.exports = {
	port: 4000,
	"auto-refresh": true,
	entry: "index.html",
	watches: [
		"lib",
		"name",
		"./index.html"
	],
	ignores: [
		"node_modules",
		"jspm_packages",
		"bower_components"
	],
	routers: [
		{
			url: "/main",
			method: "GET",
			handler: function(req, res, next) {
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
				res.setHeader("Content-Type", "application/json; charset=utf-8");
				res.end(JSON.stringify({
					tip: "请求内容",
					res: req.body
				}));
			}
		}
	]
};