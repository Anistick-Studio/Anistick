const loadPost = require("../request/post_body");
const mp3Duration = require("mp3-duration");
const voices = require("./info").voices;
const asset = require("../asset/main");
const util = require("../misc/util");
const tts = require("./main");
const http = require("http");
const fs = require("fs");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/convertTextToSoundAsset/") return;
	loadPost(req, res).then(data => {
		tts(data.voice, data.text).then((buffer) => {
			mp3Duration(buffer, (e, d) => {
				var dur = d * 1e3;
				if (e || !dur) {
					res.end(1 + util.xmlFail("Unable to retrieve MP3 stream."));
					return true;
				} else {
					const title = `[${voices[data.voice].desc}] ${data.text}`;
					asset.save(data.ut, "sound", "mp3", buffer, "tts").then(id => {
						asset.createMeta(id, `t-${id}.mp3`, "sound", "tts", dur);
						res.end(`0<response><asset><id>${id}.mp3</id><enc_asset_id>${
							id
						}.mp3</enc_asset_id><type>sound</type><subtype>tts</subtype><title>${
							title
						}</title><published>0</published><tags></tags><duration>${
							dur
						}</duration><downloadtype>progressive</downloadtype><file>${id}.mp3</file></asset></response>`);
					}).catch(e => {
						console.log(e);
						res.end(1 + util.xmlFail(e));
					});
				}
			});
		}).catch(e => {
			console.log(e);
			res.end(1 + util.xmlFail(e));
		});
	});
	return true;
};
