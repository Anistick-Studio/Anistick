const chars = require("../character/main");
const fUtil = require("../misc/file");
const caché = require("./caché");
const fs = require("fs");
const process = require("process");

module.exports = {
	parseXmls(v) {
		let xml;
		switch (v.type) {
			case "char": {
				xml = `<char id="${v.id}" enc_asset_id="${v.id}" name="Untitled" cc_theme_id="${v.themeId}" thumbnail_url="char_default.png" copyable="Y"><tags/></char>`;
				break;
			} case "bg": {
				xml = `<background subtype="0" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" asset_url="/assets/${v.type}/${v.id}"/>`
				break;
			} case "movie": {
				xml = `<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${v.title}" thumbnail_url="/starter_thums/${v.id}.png"><tags></tags></movie>`;
				break;
			} case "prop": {
				if (v.subtype == "video") {
					xml = `<prop subtype="video" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" placeable="1" facing="left" width="${v.width}" height="${v.height}" asset_url="/assets/video/${v.id}" thumbnail_url="/assets/video/${v.id.slice(0, -3) + "png"}"/>`;
				} else {
					xml = `<prop subtype="0" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" headable="${v.headable}" holdable="${v.holdable}" wearable="${v.wearable}" placeable="${v.placeable}" facing="left" width="0" height="0" asset_url="/assets/${v.type}/${v.id}"/>`;
				}
				break;
			} case "sound": {
				xml = `<sound subtype="${v.subtype}" id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`;
				break;
			}
		}
		return xml;
	},
	meta(file, type, subtype) {
		const id = file.slice(0, -4);
		var meta;
		const title = fs.readFileSync(process.env.META_FOLDER + `/${id}-title.txt`, 'utf8');
		switch (type) {
			case "prop": {
				const m = require("." + process.env.META_FOLDER + `/${id}-meta.json`);
				if (subtype == "video") meta = {
					id: file, title: title, width: m.width, height: m.height, type: "prop", subtype: subtype
				};
				else meta = {
					id: file, title: title, holdable: m.holdable, headable: m.headable, wearable: m.wearable, placeable: m
					.placeable, type: "prop"
				};
			}
		}
		return meta;
	},
	createMeta(id, name, type, subtype, dur = false) {
		var prefix;
		switch (type) {
			case "bg": {
				prefix = "b";
				break;
			} case "prop": {
				prefix = "p";
				break;
			} case "sound": {
				switch (subtype) {
					case "tts": {
						prefix = "t";
						break;
					} case "bgmusic": {
						prefix = "bg";
						break;
					} case "soundeffect": {
						prefix = "s";
						break;
					} case "voiceover": {
						prefix = "v";
						break;
					}
				}
				fs.writeFileSync(process.env.META_FOLDER + `/${prefix}-${id}-dur.txt`, `dur.${dur}`);
			}
		}
		fs.writeFileSync(process.env.META_FOLDER + `/${prefix}-${id}-title.txt`, name);
	},
	load(aId, ext) {
		return new Promise((res, rej) => {
			if (!ext) ext = "mp3"
			if (!fUtil.getFileIndexForAssets("asset-", `.${ext}`, aId)) rej("Error: The file that was trying to load does not exist.");
			else {
				const path = fUtil.getFileIndexForAssets("asset-", `.${ext}`, aId);
				res(fs.readFileSync(path));
			}
		});
	},
	delete(id, type) {
		const n = Number.parseInt(id.substr(2));
		var fn;
		if (fs.existsSync(fUtil.getFileIndexForAssets(`${type}-`, `.jpg`, n))) {
			fn = fUtil.getFileIndexForAssets(`${type}-`, `.jpg`, n);
		} else if (fs.existsSync(fUtil.getFileIndexForAssets(`${type}-`, `.png`, n))) {
			fn = fUtil.getFileIndexForAssets(`${type}-`, `.png`, n);
		} else if (fs.existsSync(fUtil.getFileIndexForAssets(`${type}-`, `.mp3`, n))) {
			fn = fUtil.getFileIndexForAssets(`${type}-`, `.mp3`, n);
			if (fs.existsSync(fUtil.getFileIndexForAssets(`asset-`, `.mp3`, n))) {
				fs.unlinkSync(fUtil.getFileIndexForAssets(`asset-`, `.mp3`, n))
			}
		} else return;
		isNaN(n) ? rej("Error: Your ID Has Failed To Parse. Please Try Again Later.") : fs.unlinkSync(fn);
		fs.unlinkSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-title.txt`);
		if (fs.existsSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-meta.json`)) {
			fs.unlinkSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-meta.json`);
		}
		if (fs.existsSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-ext.txt`)) {
			fs.unlinkSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-ext.txt`);
		}
		if (fs.existsSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-dur.txt`)) {
			fs.unlinkSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-dur.txt`);
		}
	},
	loadOnGetRequest(type, aId, ext) {
		return new Promise(async (res, rej) => {
			const n = Number.parseInt(aId.substr(2));
			const fn = fUtil.getFileIndexForAssets(`${type}-`, `.${ext}`, n);
			isNaN(n) ? rej("Error: Your ID Has Failed To Parse. Please Try Again Later.") : res(fs.readFileSync(fn));
		});
	},
	save(_ut, type, ext, buffer, subtype) {
		return new Promise(res => {
			var id;
			if (type != "sound") {
				id = fUtil.getNextFileIdForAssets(`${type}-`, `.${ext}`);
				const path = fUtil.getFileIndexForAssets(`${type}-`, `.${ext}`, id);
				fs.writeFileSync(path, buffer);
			} else {
				id = fUtil.getNextFileIdForAssets(`asset-`, `.${ext}`);
				const path = fUtil.getFileIndexForAssets(`asset-`, `.${ext}`, id);
				const subpath = fUtil.getFileIndexForAssets(`${subtype}-`, `.${ext}`, id);
				fs.writeFileSync(subpath, buffer);
				fs.writeFileSync(path, buffer);
			}
			res(id);
		});
	},
	saveStream(_ut, type, ext, buffer, subtype) {
		var id;
		if (type != "sound") {
			if (type == "prop" && subtype != "video") {
				id = fUtil.getNextFileIdForAssets(`${type}-`, `.${ext}`);
				const path = fUtil.getFileIndexForAssets(`${type}-`, `.${ext}`, id);
				fs.writeFileSync(path, buffer);
			} else {
				id = fUtil.getNextFileIdForAssets(`${subtype}-`, `.${ext}`);
				const path = fUtil.getFileIndexForAssets(`${subtype}-`, `.${ext}`, id);
				fs.writeFileSync(path, buffer);
			}
		} else {
			id = fUtil.getNextFileIdForAssets(`asset-`, `.${ext}`);
			const path = fUtil.getFileIndexForAssets(`asset-`, `.${ext}`, id);
			const subpath = fUtil.getFileIndexForAssets(`${subtype}-`, `.${ext}`, id);
			fs.writeFileSync(subpath, buffer);
			fs.writeFileSync(path, buffer);
		}
		return `${id}.${ext}`;
	},
	list(type, ext) {
		const table = [];
		var ids;
		switch (type) {
			case "bg": {
				ids = fUtil.getValidAssetFileIndicies("bg-", `.${ext}`);
				for (const i in ids) {
					const id = `b-${ids[i]}`;
					table.unshift({ id: id, type: type });
				}
				break;
			} case "prop": {
				ids = fUtil.getValidAssetFileIndicies("prop-", `.${ext}`);
				for (const i in ids) {
					const id = `p-${ids[i]}`;
					table.unshift({ id: id, type: type });
				}
				break;
			} case "bgmusic": {
				ids = fUtil.getValidAssetFileIndicies("bgmusic-", `.${ext}`);
				for (const i in ids) {
					const id = `bg-${ids[i]}`;
					table.unshift({ id: id, type: type });
				}
				break;
			} case "soundeffect": {
				ids = fUtil.getValidAssetFileIndicies("soundeffect-", `.${ext}`);
				for (const i in ids) {
					const id = `s-${ids[i]}`;
					table.unshift({ id: id, type: type });
				}
				break;
			} case "voiceover": {
				ids = fUtil.getValidAssetFileIndicies("voiceover-", `.${ext}`);
				for (const i in ids) {
					const id = `v-${ids[i]}`;
					table.unshift({ id: id, type: type });
				}
				break;
			} case "video": {
				ids = fUtil.getValidAssetFileIndicies("video-", `.${ext}`);
				for (const i in ids) {
					const id = `vi-${ids[i]}`;
					table.unshift({ id: id, type: type });
				}
				break;
			}
		}
		return table;
	},
	chars(theme) {
		return new Promise(async res => {
			switch (theme) {
				case "custom":
					theme = "family";
					break;
				case "action":
				case "animal":
				case "space":
				case "vietnam":
					theme = "cc2";
					break;
			}

			var table = [];
			var ids = fUtil.getValidFileIndicies("char-", ".xml");
			for (const i in ids) {
				var id = `c-${ids[i]}`;
				if (!theme || theme == (await chars.getTheme(id))) {
					table.unshift({ theme: theme, id: id });
				}
			}
			res(table);
		});
	},
};
