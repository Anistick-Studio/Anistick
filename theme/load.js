const loadPost = require("../request/post_body");
const folder = process.env.THEME_FOLDER;
const fUtil = require("../fileUtil");
const http = require("http");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "POST" || url.pathname != "/goapi/getTheme/") return;
	loadPost(req, res).then(data => {
		res.setHeader("Content-Type", "application/zip");
		fUtil.makeZip(`${folder}/${data.themeId}.xml`, "theme.xml").then((b) => res.end(b));
	});
	return true;
};
