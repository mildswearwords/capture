const puppeteer = require('puppeteer');
const {Firestore} = require('@google-cloud/firestore');
const {Storage} = require('@google-cloud/storage');

// Setup dbs and buckets
const db = new Firestore();
const storage = new Storage();
const timeout = 20000; // 20 seconds

async function capturePage(url, urlId) {
  console.log(`[START] Capturing: ${urlId} - ${url}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    console.log(`[NAVIGATE] Loading page: ${url}`);
    const loadPage = page.goto(url, { waitUntil: 'networkidle2' });

    await Promise.race([
      loadPage,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Page load took too long')), timeout)
      ),
    ]);

    console.log(`[PAGE LOADED] Page loaded or timeout triggered`);

    await page.waitForSelector('body', { visible: true });
    console.log(`[BODY DETECTED] Proceeding to capture`);

    const html = await page.content();
    const shotSettings = {
      fullPage: true,
      encoding: 'binary',
    };

    const screenShot = await page.screenshot(shotSettings);
    console.log(`[SCREENSHOT TAKEN] Screenshot captured`);

    await browser.close();
    console.log(`[BROWSER CLOSED]`);

    const bucket = storage.bucket('scraper25');
    const dateString = new Date().toISOString().slice(0, 10);

    const imgPath = `${urlId}${dateString}.png`;
    const htmlPath = `${urlId}${dateString}.html`;

    await bucket.file(imgPath).save(screenShot, {
      metadata: { contentType: 'image/png' },
    });
    console.log(`[UPLOAD] Screenshot uploaded: ${imgPath}`);

    await bucket.file(htmlPath).save(html);
    console.log(`[UPLOAD] HTML uploaded: ${htmlPath}`);

    await db.collection('shots').add({
      url,
      urlId,
      shotTime: new Date(),
      htmlFileUrl: `gs://scraper25/${htmlPath}`,
      imgFileUrl: `gs://scraper25/${imgPath}`,
    });

    console.log(`[DB WRITE] Metadata written for ${urlId}`);
    return { url };
  } catch (error) {
    console.error(`[ERROR] Capture failed for ${urlId}: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn(`[CLEANUP] Browser close failed: ${e.message}`);
      }
    }
  }
}

async function main() {
  console.log('[MAIN] Starting run');
  const snapshot = await db.collection('urls').get();
  for (const doc of snapshot.docs) {
    console.log(`[CHECKING] ${doc.id}`);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0);
    const latest = await db
      .collection('shots')
      .where('urlId', '==', doc.id)
      .where('shotTime', '>=', startOfDay)
      .get();

    if (!latest.empty) {
      console.log(`[SKIPPED] Already processed today: ${doc.id}`);
      continue;
    }

    const result = await capturePage(doc.data().url, doc.id);
    console.log(`[DONE] ${JSON.stringify(result)}`);
  }
  console.log('[MAIN] Run complete');
}

main();
