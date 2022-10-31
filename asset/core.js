const loadPost = require("../request/post_body");
const header = process.env.XML_HEADER;
const formidable = require("formidable");
const fUtil = require("../fileUtil");
const nodezip = require("node-zip");
const base = Buffer.alloc(1, 0);
const asset = require("./main");
const http = require("http");
const fs = require("fs");
const starter = require("../starter/main");
const util = require("../misc/util");
function movieXml(v) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const tag = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-tag.txt`, 'utf8');
	return `<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${
		title
	}" thumbnail_url="/starter_thumbs/${v.id}.png"><tags>${tag}</tags></movie>`;
}
function propXml(v) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const ext = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-ext.txt`, 'utf8') || getImgExt(title);
	const meta = require('.' + process.env.META_FOLDER + `/${v.id}-meta.json`);
	return `<prop subtype="0" id="${v.id}.${ext}" name="${
		title
	}" enable="Y" holdable="${meta.holdable}" headable="${meta.headable}" wearable="${meta.wearable}" placeable="${
		meta.placeable
	}" facing="left" width="0" height="0" asset_url="/assets/${v.type}/${v.id}.${ext}"/>`;
}
function getImgExt(buffer) {
	const dot = buffer.lastIndexOf(".");
	return buffer.substr(dot + 1);
}
function backgroundXml(v) {
	const title = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-title.txt`, 'utf8');
	const ext = fs.readFileSync(process.env.META_FOLDER + `/${v.id}-ext.txt`, 'utf8') || getImgExt(title);
	return `<background subtype="0" id="${v.id}.${ext}" asset_url="/assets/${v.type}/${v.id}.${ext}" name="${title}" enable="Y"/>`;
}
async function listAssets(data) {
	var xmlString, files;
	switch (data.type) {
		case "char": {
			const chars = await asset.chars(data.themeId);
			xmlString = `${header}<ugc more="0">${chars.map(v => `<char id="${v.id}" name="Untitled" cc_theme_id="${
				v.theme
			}" thumbnail_url="/char_thumbs/${v.id}.png" copyable="Y"><tags/></char>`).join("")}</ugc>`;
			break;
		}
		case "prop": {
			const assets = asset.list("prop", "png");
			files = asset.list("prop", "jpg");
			xmlString = `${header}<ugc more="0">${files.map(v => propXml(v)).join("")}${assets.map(v => propXml(v)).join("")}</ugc>`;
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
		case "GET": {
			const match = req.url.match(/\/assets\/([^/]+)\/([^/]+)$/);
			if (!match) return;
			const type = match[1];
			const aId = match[2];
			const dot = aId.lastIndexOf(".");
			const ext = aId.substr(dot + 1);
			asset.loadOnGetRequest(type, aId, ext).then(b => res.end(b)).catch(e => { 
				console.log(e), res.end(`<center><h1>${e || "404 Not Found"}</h1></center>`)
			});
			return true;
		} case "POST": {
			switch (url.pathname) {
				case "/goapi/getAsset/":
				case "/goapi/getAssetEx/": {
					loadPost(req, res).then(data => {
						asset.load(data.assetId.slice(0, -4)).then(b => {
							res.setHeader("Content-Length", b.length);
							res.setHeader("Content-Type", "audio/mp3");
							res.end(b);
						}).catch(e => {
							res.end(1 + util.xmlFail(e));
							console.log(e);
							return;
						});
					}).catch(e => console.log(e));
					return true;
				} case "/goapi/updateAsset/": {
					loadPost(req, res).then(data => {
						const id = data.assetId.slice(0, -4);
						const origTitle = fs.readFileSync(process.env.META_FOLDER + `/${id}-title.txt`);
						const dot = origTitle.lastIndexOf(".") || "";
						const ext = origTitle.subarray(dot + 1) || "";
						if (!fs.existsSync(process.env.META_FOLDER + `/${id}-ext.txt`)) {
							fs.writeFileSync(process.env.META_FOLDER + `/${id}-ext.txt`, ext);
						}
						fs.writeFileSync(process.env.META_FOLDER + `/${id}-title.txt`, data.title);
					}).catch(e => console.log(e));
					return true;
				} case "/goapi/getUserAssets/": {	
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
								}).catch(e => {
									res.end(1 + util.assetFail(e));
									console.log(e);
									return;
								});
								break;
							} case "bg": {
								function listBackgrounds() {
									return new Promise(async res => {
										const assets = asset.list("bg", "png");
										files = asset.list("bg", "jpg");
										const xml = `${header}<ugc more="0">${files.map((v) => backgroundXml(v)).join("")}${
											assets.map((v) => backgroundXml(v)).join("")
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
								}).catch(e => {
									res.end(1 + util.assetFail(e));
									console.log(e);
									return;
								});
								break;
							}
						}
					}).catch(e => console.log(e));
					return true;
				} case "/goapi/getUserAssetsXml/": {
					loadPost(req, res).then(data => listAssets(data)).then((buff) => {
						res.setHeader("Content-Type", "text/xml");
						res.end(buff);
					}).catch(e => {
						res.end(1 + util.assetFail(e));
						console.log(e);
						return;
					});
					return true;
				} case "/upload_asset": {
					formidable().parse(req, (_, fields, files) => {
						const [ ut, type, ext ] = fields.params.split(".");
						const path = files.import.path;
						const name = files.import.name;
						const buffer = fs.readFileSync(path);
						asset.save(ut, type, ext, buffer).then(id => {
							asset.createMeta(id, name, type);
							if (type == "prop") {
								const meta = {
									holdable: "0",
									wearable: "0",
									headable: "0",
									placeable: "1"
								};
								fs.writeFileSync(process.env.META_FOLDER + `/p-${id}-meta.json`, JSON.stringify(meta));
							}
						}).catch(e => console.log(e));
					}).catch(e => console.log(e));
					return true;
				} case "/goapi/deleteAsset/": {
					loadPost(req, res).then(data => {
						var type;
						const id = data.assetId;
						if (id.startsWith("p-")) type = "prop";
						else if (id.startsWith("b-")) type = "bg";
						else return;
						asset.delete(id, type);
					}).catch(e => console.log(e));
					return true;
				}
			}
		} default: return;
	}
};
