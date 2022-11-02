const fu = document.getElementById('fileupload'),
sub = document.getElementById('submit');
function showImporter() {
	fu.click();
};
function importComplete(obj) {
	const file = obj.files[0];
	if (file !=undefined) {
		const ext = file.name.substring(file.name.lastIndexOf('.') + 1);
		var params = flashvars.ut+'.';
		if (ext == 'mp3' || ext == 'wav') {
			var c;
			while (c != 'vo' && c != 'se' && c != 'mu') {
				c = prompt('Would you like to upload this as a voiceover (\"vo\"), sound effect (\"se\"), or as music (\"mu\")?').toLowerCase();
			}
			params += c;
		} else if( ext == 'jpg' || ext == 'png' || ext == 'mp4') {
			var c;
			while (c != 'bg' && c != 'prop' && c != 'vi') {
				c = prompt('Would you like to upload this as a background (\"bg\") or as a prop (\"prop\") or as a video (\"vi\")?').toLowerCase();
			}
			params += c;
		}
		obj.parentElement.firstChild.value = params + '.' + ext;
		sub.click();
		return true;
	}
}