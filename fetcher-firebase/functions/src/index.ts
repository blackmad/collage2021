import * as admin from 'firebase-admin';
admin.initializeApp();

import * as functions from 'firebase-functions';
import { doDownloadUpload } from './downloader';
import { doScrape } from './scraper';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.scheduledFunction = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async (context) => {
    console.log('This will be run every 10 minute!');
    await doScrape();
    return null;
  });

exports.myFunction = functions.firestore
  .document('discover/{docId}')
  .onCreate(async (snap, context) => {
    const newValue = snap.data();
    console.log(newValue);
    const destination = await doDownloadUpload(newValue as any);
    await snap.ref.update({
      downloaded: true,
      bucketPath: destination,
      bucket: 'collage',
      needsDownload: false,
    });
  });

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: true }));

const firestore = admin.firestore();
app.get('/', async (req: Express.Request, res: any) => {
  const snapshot = await firestore.collection('objects').limit(100).get();
  const objects = snapshot.docs.map((d) => d.data());
  res.json({
    objects,
  });
  // res.
  // res.send({
  //   objects: docs.map(d => d.data)
  // }
});

exports.objects = functions.https.onRequest(app);
