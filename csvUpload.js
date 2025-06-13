const {Firestore} = require('@google-cloud/firestore');
const fs = require('fs');

// Initialize Firebase Admin SDK
const db = new Firestore();

// Path to your CSV file
const csvFilePath = 'urls.csv';  // Replace with the path to your CSV file

async function uploadUrlsToFirebase() {
  const urls = [];

  // Read and parse the CSV file
  const data = fs.readFileSync(csvFilePath, 'utf8');
  
  // Split the data into rows and skip the header row
  const rows = data.split('\n').slice(1); // Assuming the first row is a header

  // Loop through each row and extract the URL, Brand, PageType, and ProductCategory
  rows.forEach((row) => {
    const columns = row.split('\t');
    const url = columns[0].trim(); // Assuming URL is in the first column
    const brand = columns[1].trim(); // Assuming Brand is in the second column
    const pageType = columns[2].trim(); // Assuming PageType is in the third column
    const productCategory = columns[3].trim(); // Assuming ProductCategory is in the fourth column

    // Only add the row if the URL is present
    if (url) {
      urls.push({
        url,
        brand,
        pageType,
        productCategory,
        createdAt: new Date()
      });
    }
  });

  // Upload the parsed URLs and other details to Firestore
  const batch = db.batch();
  const collectionRef = db.collection('urls'); // Choose your collection name

  urls.forEach((urlData) => {
    const docRef = collectionRef.doc(); // Auto-generate document ID
    batch.set(docRef, urlData);
  });

  try {
    await batch.commit(); // Commit the batch to Firestore
    console.log('URLs successfully uploaded to Firestore!');
  } catch (error) {
    console.error('Error uploading URLs to Firestore:', error);
  }
}

uploadUrlsToFirebase();
//For ref odL4Dg7wzsKZWVFC4ZWG