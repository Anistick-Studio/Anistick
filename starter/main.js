const parse = require('../data/parse');
const fUtil = require('../fileUtil');
const nodezip = require('node-zip');
const fs = require('fs');

module.exports = {
	meta(sId) {
		return new Promise(async res => {
			if (!sId.startsWith("s-")) return;
			const n = Number.parseInt(sId.substr(2));
			const fn = fUtil.getFileIndex("starter-", ".xml", n);

			const fd = fs.openSync(fn, "r");
			const buffer = Buffer.alloc(256);
			fs.readSync(fd, buffer, 0, 256, 0);
			const begTitle = buffer.indexOf("<title>") + 16;
			const endTitle = buffer.indexOf("]]></title>");
			const title = buffer.slice(begTitle, endTitle).toString().trim();
			const begTag = buffer.indexOf("<tag>") + 14;
			const endTag = buffer.indexOf("]]></tag>");
			const tag = buffer.slice(begTag, endTag).toString().trim();

			fs.closeSync(fd);
			res({
				title: title,
				tags: tag,
				id: sId,
			});
		});
	},
	save(starterZip, thumb, mId) {
		return new Promise((res, rej) => {
			const zip = nodezip.unzip(starterZip);
			var sId = fUtil.getNextFileId('starter-', '.xml');
			if (mId) sId = mId;
			let path = fUtil.getFileIndex('starter-', '.xml', sId);
			const thumbFile = fUtil.getFileIndex('starter-', '.png', sId);
			fs.writeFileSync(thumbFile, thumb);
			let writeStream = fs.createWriteStream(path);
			parse.unpackZip(zip, thumb).then(data => {
				writeStream.write(data, () => {
					writeStream.close();
					this.meta("s-" + sId).then(m => {
						fs.writeFileSync(process.env.META_FOLDER + `/${m.id}-tag.txt`, m.tags);
						fs.writeFileSync(process.env.META_FOLDER + `/${m.id}-title.txt`, m.title);
						res(m.id);
					}).catch(e => rej(e));
				});
			}).catch(e => rej(e));
		});
	},
	delete(sId) {
		if (!sId.startsWith("s-")) return;
		const n = Number.parseInt(sId.substr(2));
		const xml = fUtil.getFileIndex("starter-", ".xml", n);
		const png = fUtil.getFileIndex("starter-", ".png", n);
		const title = process.env.META_FOLDER + `/${sId}-title.txt`;
		const tag = process.env.META_FOLDER + `/${sId}-tag.txt`;
		fs.unlinkSync(xml);
		fs.unlinkSync(png);
		fs.unlinkSync(title);
		fs.unlinkSync(tag);
	},
	thumb(movieId) {
		return new Promise((res, rej) => {
			if (!movieId.startsWith('s-')) return;
			const n = Number.parseInt(movieId.substr(2));
			const fn = fUtil.getFileIndex('starter-', '.png', n);
			isNaN(n) ? rej() : res(fs.readFileSync(fn));
		});
	},
	list() {
		return new Promise((res, rej) => {
			const table = [];
			var ids = fUtil.getValidFileIndicies('starter-', '.xml');
			for (const i in ids) {
				var id = `s-${ids[i]}`;
				table.unshift({ id: id });
			}
			res(table);
		});
	},
}