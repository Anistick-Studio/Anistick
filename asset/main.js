const chars = require("../character/main");
const fUtil = require("../misc/file");
const caché = require("./caché");
const fs = require("fs");

module.exports = {
	createMeta(id, name, type) {
		var prefix;
		switch (type) {
			case "bg": {
				prefix = "b";
				break;
			} case "prop": {
				prefix = "p";
				break;
			}
		}
		fs.writeFileSync(process.env.META_FOLDER + `/${prefix}-${id}-title.txt`, name);
	},
	load(aId) {
		return new Promise((res, rej) => {
			if (!fUtil.getFileIndexForAssets("asset-", ".mp3", aId)) rej("Error: The file that was trying to load does not exist.");
			else {
				const path = fUtil.getFileIndexForAssets("asset-", ".mp3", aId);
				res(fs.readFileSync(path));
			}
		});
	},
	delete(id, type) {
		const n = Number.parseInt(id.substr(2));
		var fn;
		if (!fs.existsSync(fUtil.getFileIndexForAssets(`${type}-`, `.jpg`, n))) {
			fn = fUtil.getFileIndexForAssets(`${type}-`, `.png`, n);
		} else if (!fs.existsSync(fUtil.getFileIndexForAssets(`${type}-`, `.png`, n))) {
			fn = fUtil.getFileIndexForAssets(`${type}-`, `.jpg`, n);
		}
		isNaN(n) ? rej("Error: Your ID Has Failed To Parse. Please Try Again Later.") : fs.unlinkSync(fn);
		fs.unlinkSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-title.txt`);
		fs.unlinkSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-meta.json`);
		if (fs.existsSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-ext.txt`)) {
			fs.unlinkSync(process.env.META_FOLDER + `/${id.slice(0, -4)}-ext.txt`);
		}
	},
	loadOnGetRequest(type, aId, ext) {
		return new Promise(async (res, rej) => {
			const n = Number.parseInt(aId.substr(2));
			const fn = fUtil.getFileIndexForAssets(`${type}-`, `.${ext}`, n);
			isNaN(n) ? rej("Error: Your ID Has Failed To Parse. Please Try Again Later.") : res(fs.readFileSync(fn));
		});
	},
	save(_ut, type, ext, buffer) {
		return new Promise(res => {
			const id = fUtil.getNextFileIdForAssets(`${type}-`, `.${ext}`);
			const path = fUtil.getFileIndexForAssets(`${type}-`, `.${ext}`, id);
			fs.writeFileSync(path, buffer);
			res(id);
		});
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
