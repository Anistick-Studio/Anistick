const loadPost = require("../request/post_body"),
movie = require("./main"),
http = require("http");
const get = require("../request/get");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/saveMovie/") return;
	loadPost(req, res).then(data => {
		get(process.env.THUMB_BASE_URL + '/274502704.jpg').then(t => {
			const body = Buffer.from(data.body_zip, "base64"),
			thumb = !data.thumbnail ? t : Buffer.from(data.thumbnail, "base64");
			movie.save(body, thumb, data.presaveId).then(id => res.end(0 + id)).catch(e => console.log(e));
		}).catch(e => console.log(e));
	}).catch(e => console.log(e));
	return true;
};
