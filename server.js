const HTTP_PORT = process.env.PORT || 80;
const HTTPS_PORT = process.env.PORT || 443;
const env = Object.assign(process.env, require("./env"), require("./config"));

const http = require("http");
const https = require("https");
const fs = require("fs");
const chr = require("./character/redirect");
const pmc = require("./character/premade");
const chl = require("./character/load");
const chs = require("./character/save");
const cht = require("./character/thmb");
const mvu = require("./movie/upload");
const stl = require("./static/load");
const str = require("./starter/core");
const stt = require("./starter/thmb");
const stp = require("./static/page");
const asc = require("./asset/core");
const ast = require("./asset/thmb");
const mvl = require("./movie/load");
const mvL = require("./movie/list");
const mvm = require("./movie/meta");
const mvs = require("./movie/save");
const mvt = require("./movie/thmb");
const thL = require("./theme/list");
const thl = require("./theme/load");
const tsv = require("./tts/voices");
const tsl = require("./tts/load");
const url = require("url");
if (!fs.existsSync(env.ASSETS_FOLDER)) fs.mkdirSync(env.ASSETS_FOLDER);
if (!fs.existsSync(env.META_FOLDER)) fs.mkdirSync(env.META_FOLDER);

const functions = [str, stt, mvL, pmc, chl, thl, thL, chs, cht, asc, tsl, chr, ast, mvm, mvl, mvs, mvt, tsv, mvu, stp, stl];

let opt = {
	key: fs.readFileSync('the.key'),
  	cert: fs.readFileSync('the.cert')
};
function scf() {
	http.createServer(function (req, res) {
		try {
			const parsedUrl = url.parse(req.url, true);
			//if (!parsedUrl.path.endsWith('/')) parsedUrl.path += '/';
			const found = functions.find((f) => f(req, res, parsedUrl));
			if (!found) res.statusCode = 404;
			console.log(req.method, parsedUrl.path, "-", res.statusCode);
		} catch (x) {
			const parsedUrl = url.parse(req.url, true);
			res.statusCode = 500;
			console.log(x);
			console.log(req.method, parsedUrl.path, "-", res.statusCode);
		}
	})
	.listen(HTTP_PORT, "127.0.0.1", console.log("Anistick (HTTP) Has Started"));


	https.createServer(opt, function (req, res) {
		try {
			const parsedUrl = url.parse(req.url, true);
			//if (!parsedUrl.path.endsWith('/')) parsedUrl.path += '/';
			const found = functions.find((f) => f(req, res, parsedUrl));
			if (!found) res.statusCode = 404;
			console.log(req.method, parsedUrl.path, "-", res.statusCode);
		} catch (x) {
			const parsedUrl = url.parse(req.url, true);
			res.statusCode = 500;
			console.log(x);
			console.log(req.method, parsedUrl.path, "-", res.statusCode);
		}
	})
	.listen(HTTPS_PORT, "127.0.0.1", console.log("Anistick (HTTPS) Has Started"));
};
module.exports.scf = scf;
