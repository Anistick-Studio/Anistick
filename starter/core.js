const loadPost = require("../request/post_body");
const starter = require("./main");
const http = require("http");
const fs = require("fs");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.pathname) {
		case "/goapi/saveTemplate/": {
			loadPost(req, res).then(data => {
				const body = Buffer.from(data.body_zip, "base64"),
				thumb = Buffer.from(data.thumbnail, "base64");
				starter.save(body, thumb, data.movieId).then((nId) => res.end("0" + nId));
			});
			return true;
		} case "/goapi/updateSysTemplateAttributes/": {
			loadPost(req, res).then(data => {
				fs.writeFileSync(process.env.META_FOLDER + `/${data.movieId}-title.txt`, data.title);
				fs.writeFileSync(process.env.META_FOLDER + `/${data.movieId}-tag.txt`, data.tags);
			});
			return true;
		} case "/goapi/deleteUserTemplate/": {
			loadPost(req, res).then(data => starter.delete(data.templateId));
			return true;
		}
	}
};
