const cachéFolder = process.env.CACHÉ_FOLDER;
const fs = require("fs");

/**
 * @summary Dictionary of hashmaps of saved assets, respective to each movie ID loaded.
 * @typedef {string[]} cTableType
 * @typedef {{[mId:string]:cTableType}} lcType
 * @type lcType
 */
const localCaché = {};
var size = 0;

// IMPORTANT: serialises the cachéd files into the dictionaries.
fs.readdirSync(cachéFolder).forEach((v) => {
	const index = v.indexOf(".");
	const prefix = v.substr(0, index);
	const suffix = v.substr(index + 1);

	if (!localCaché[prefix]) localCaché[prefix] = [];
	localCaché[prefix].push(suffix);
});

module.exports = {
	/**
	 * @summary Generates a random ID with a given prefix and suffix that is unique to the given table.
	 * @param {string} pre
	 * @param {string} suf
	 * @param {cTableType} table
	 */
	generateId(pre = "", suf = "", table = []) {
		var id;
		do id = `${pre}${("" + Math.random()).replace(".", "")}${suf}`;
		while (table.includes(id));
		return id;
	},
	validAssetId(aId) {
		switch (aId) {
			case "id":
			case "time":
				return false;
			default:
				return true;
		}
	},
	/**
	 *
	 * @summary Saves a given dictionary of buffers to caché.
	 * @param {string} mId
	 * @param {{[aId:string]:Buffer}} buffers
	 * @returns {{[aId:string]:Buffer}}
	 */
	saveTable(mId, buffers = {}) {
		for (const aId in buffers) {
			this.save(mId, aId, buffers[aId]);
		}
		return buffers;
	},
	/**
	 *
	 * @summary Retrieves an array of buffers from a given video's caché.
	 * @param {string} mId
	 * @returns {{[aId:string]:Buffer}}
	 */
	loadTable(mId) {
		const buffers = {};
		this.list(mId).forEach((aId) => {
			buffers[aId] = fs.readFileSync(`${cachéFolder}/${mId}.${aId}`);
		});
		return buffers;
	},
	/**
	 *
	 * @summary Retrieves the array of asset IDs for the given video.
	 * @param {string} mId
	 * @returns {cTableType}
	 */
	 list(mId) {
		return localCaché[mId] || [];
	},
	/**
	 *
	 * @summary Transfers all caché data as if 'old' had never existed.
	 * @param {string} old
	 * @param {string} nëw
	 * @returns {void}
	 */
	transfer(old, nëw) {
		if (nëw == old || !localCaché[old]) return;
		(localCaché[nëw] = localCaché[old]).forEach((aId) => {
			const oldP = `${cachéFolder}/${old}.${aId}`;
			const nëwP = `${cachéFolder}/${nëw}.${aId}`;
			fs.renameSync(oldP, nëwP);
		});
		delete localCaché[old];
	},
	/**
	 *
	 * @param {string} mId
	 * @param {boolean} setToEmpty
	 * @returns {void}
	 */
	clearTable(mId, setToEmpty = true) {
		const stored = localCaché[mId];
		if (!stored) return;
		stored.forEach((aId) => {
			if (aId != "time") {
				var path = `${cachéFolder}/${mId}.${aId}`;
				size -= fs.statSync(path).size;
				fs.unlinkSync(path);
			}
		});
		if (setToEmpty) localCaché[mId] = [];
		else delete localCaché[mId];
	},
};
