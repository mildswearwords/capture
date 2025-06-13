const puppeteer = require('puppeteer');
const {Firestore} = require('@google-cloud/firestore');
const {Storage} = require ('@google-cloud/storage');

//Setup dbs and buckets
const db = new Firestore();
const storage = new Storage();
const timeout = 20000; // 20 seconds in milliseconds


async function capturePage(url, urlId) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  const page = await browser.newPage();
  const loadPage = page.goto(url, { waitUntil: 'networkidle2' });
  // Race the page loading against a timeout
  try {
    await Promise.race([
      loadPage,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: Page load took too long')), timeout)),
    ]);
  } catch (error) {
    if (error.message === 'Timeout: Page load took too long') {
      console.log(`Timeout reached while loading ${url} after 20s. Proceeding with screenshot...`);
    } else {
      console.log(`Error loading ${url}: ${error.message}`);
    }
  }
  await page.waitForSelector('body', { visible: true });
  // Capture HTML content
  const html = await page.content();
  const shotSettings = {
    fullPage: true,
    encoding:'binary'
  }
  // Capture screenshot and save to /tmp (default writable directory)
  const screenShot = await page.screenshot(shotSettings);
  await browser.close();
  const bucket = storage.bucket('scraper25');
  const dateString= new Date().toISOString().slice(0,10);
  const imgFile = bucket.file(`${urlId}${dateString}.png`);
  await imgFile.save(screenShot, {metadata:{contentType:'image/png'}});
  const htmlFile = bucket.file(`${urlId}${dateString}.html`);
  await htmlFile.save(html)
  await db.collection('shots').add({
    url: url,
    urlId: urlId,
    shotTime: new Date(),
    htmlFileUrl: `gs://scraper25/${urlId}${dateString}.html`,  // Store the path to HTML file
    imgFileUrl: `gs://scraper25/${urlId}${dateString}.png`   // Store the path to image file
  });
  return {url};
}


async function main() {
  // Fetch the list of URLs from the Firestore 'urls' collection
  const snapshot = await db.collection('urls').get();
  for (const doc of snapshot.docs) {
    console.log(`Processing: ${doc.id}`);
    // Process the URL with Puppeteer, and wait for it to complete
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0); // Sets the time to 00:01 of today
    const latest = await db.collection('shots')
      .where('urlId',"==",doc.id)
      .where('shotTime', ">=", startOfDay)
      .get();
    if(!latest.empty){continue}
    const result = await capturePage(doc.data().url, doc.id);
    console.log(result);  // Logging the result after Puppeteer finishes
  }
}

main();
