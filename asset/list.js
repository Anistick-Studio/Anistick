const loadPost = require("../request/post_body");
const header = process.env.XML_HEADER;
const fUtil = require("../fileUtil");
const nodezip = require("node-zip");
const base = Buffer.alloc(1, 0);
const asset = require("./main");
const http = require("http");
const fs = require("fs");
const starter = require("../starter/main");
function movieXml(v) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const tag = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-tag.txt`, 'utf8');
	return `<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${
		title
	}" thumbnail_url="/starter_thumbs/${v.id}.png"><tags>${tag}</tags></movie>`;
}
async function listAssets(data) {
	var xmlString, files;
	switch (data.type) {
		case "char": {
			const chars = await asset.chars(data.themeId);
			xmlString = `${header}<ugc more="0">${chars
				.map(
					(v) =>
						`<char id="${v.id}" name="Untitled" cc_theme_id="${v.theme}" thumbnail_url="http://localhost/char_thumbs/${v.id}.png" copyable="Y"><tags/></char>`
				)
				.join("")}</ugc>`;
			break;
		}
		case "sound": {
			files = asset.list(data.movieId, "voiceover");
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<sound subtype="${v.subtype}" id="${v.id}" name="${v.name}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`
				)
				.join("")}</ugc>`;
			break;
		}	
		case "prop": {
			files = asset.list(data.movieId, "prop");
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<prop subtype="0" id="${v.id}" name="${v.name}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" duration="0"/>`
				)
				.join("")}</ugc>`;
			break;
		}
	}
	return Buffer.from(xmlString);	
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {	
	switch (req.method) {
		case "POST": {
			switch (url.pathname) {
				case "/goapi/getUserAssets/": {	
					loadPost(req, res).then(data => {
						switch (data.type) {
							case "movie": {
								starter.list().then(async files => {
									const xml = `${header}<ugc more="0">${files.map((v) => movieXml(v)).join('')}</ugc>`;
									const zip = nodezip.create();
									fUtil.addToZip(zip, "desc.xml", Buffer.from(xml));
									res.setHeader("Content-Type", "application/zip");
									res.write(base);
									res.end(await zip.zip());
								}).catch(e => console.log(e));
								break;
							} case "bg": {
								function listBackgrounds() {
									return new Promise(async res => {
										files = asset.list(data.movieId, "bg");
										const xml = `${header}<ugc more="0">${
											files.map((v) => `<background subtype="0" id="${v.id}" name="${v.name}" enable="Y"/>`).join("")
										}</ugc>`;
										const zip = nodezip.create();
										fUtil.addToZip(zip, "desc.xml", Buffer.from(xml));
										res(await zip.zip());
									});
								}
								listBackgrounds().then((buff) => {
									res.setHeader("Content-Type", "application/zip");
									res.write(base);
									res.end(buff);
								}).catch(e => console.log(e));
								break;
							} case "prop": {
								function listProps() {
									return new Promise(async res => {
										files = asset.list(data.movieId, "video");
										const xml = `${header}<ugc more="0">${
											files.map((v) => `<prop height="10" width="10" id="${v.id}" name="${v.name}" enable="Y"/>`).join("")
										}</ugc>`;
										const zip = nodezip.create();
										fUtil.addToZip(zip, "desc.xml", Buffer.from(xml));
										res(await zip.zip());
									});
								}
								listProps().then((buff) => {
									res.setHeader("Content-Type", "application/zip");
									res.write(base);
									res.end(buff);
								}).catch(e => console.log(e));
								break;
							}
						}
					});
					return true;
				} case "/goapi/getUserAssetsXml/": {
					loadPost(req, res).then(data => listAssets(data)).then((buff) => {
						res.setHeader("Content-Type", "text/xml");
						res.end(buff);
					});
					return true;
				}
			}
		} default: return;
	}
};
