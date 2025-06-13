const {Firestore} = require('@google-cloud/firestore');
const {Storage} = require ('@google-cloud/storage');
const deepDiff = require('deep-diff');

const storage = new Storage();
const db = new Firestore();

file1 = 'gs://scraper25/0OqIqfaJOnlAYeQAkHd42025-05-18.html'
async function compareHtmlPages(){
	const html1 = await getFileAsString('0OqIqfaJOnlAYeQAkHd42025-05-21.html', 'scraper25');
	const html2 = await getFileAsString('0OqIqfaJOnlAYeQAkHd42025-05-22.html', 'scraper25');
	const diff = await deepDiff(html1, html2)
	 if (diff) {
		diff.forEach(change => {
  			console.log(`Kind: ${change.kind}`);
		});  		} else {
    	console.log('No differences found.');
  	}

}

async function getFileAsString(filename, bucket){
	const myFile = await storage.bucket(bucket).file(filename).download();
	return myFile.toString('utf8');
}

compareHtmlPages()
