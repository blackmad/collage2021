import * as admin from 'firebase-admin';
admin.initializeApp();

import * as functions from 'firebase-functions';
// import { doDownloadUpload } from './downloader';
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

// exports.myFunction = functions.firestore
//   .document('discover/{docId}')
//   .onCreate(async (snap, context) => {
//     const newValue = snap.data();
//     console.log(newValue);
//     const destination = await doDownloadUpload(newValue as any);
//     await snap.ref.update({
//       downloaded: true,
//       bucketPath: destination,
//       bucket: 'collage',
//       needsDownload: false,
//     });
//   });

import express = require('express');
import cors = require('cors');

function wrapCors(cb: any) {
  const app = express();

  app.use(cors({ origin: true }));

  app.get('/', cb);
  return app;
}

const firestore = admin.firestore();

exports.objects = functions.https.onRequest(
  wrapCors(async (req: express.Request, res: express.Response) => {
    const { label, newestSeen, oldestSeen, limit } = req.query;

    let query: admin.firestore.Query<admin.firestore.DocumentData> = firestore.collection(
      'objects'
    );

    if (label) {
      query = query.where('label', '==', label);
    }

    if (newestSeen) {
      query = query.where('added_at', '>=', newestSeen);
    }

    let snapshot = await query
      .orderBy('added_at', 'desc')
      .limit(parseInt((limit as string) || '100'))
      .get();

    if (snapshot.docs.length === 0 && oldestSeen) {
      console.log('rerunning from the bottom');
      query = firestore.collection('objects');

      if (label) {
        query = query.where('label', '==', label);
      }

      if (oldestSeen) {
        query = query.where('added_at', '<=', oldestSeen);
      }

      snapshot = await query
        .orderBy('added_at', 'desc')
        .limit(parseInt((limit as string) || '100'))
        .get();
    }

    const objects = snapshot.docs.map((d) => d.data());
    res.json({
      objects,
    });
  })
);

exports.images = functions.https.onRequest(
  wrapCors(async (req: Express.Request, res: any) => {
    const snapshot = await firestore
      .collection('discover')
      .where('needsSegmentation', '==', false)
      .orderBy('added_at', 'desc')
      .limit(100)
      .get();
    const objects = snapshot.docs.map((d) => d.data());
    res.json({
      objects,
    });
  })
);
