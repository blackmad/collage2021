import * as admin from "firebase-admin";
import * as _ from "lodash";
admin.initializeApp();

import * as functions from "firebase-functions";
// import { doDownloadUpload } from './downloader';
import { doScrape } from "./scraper";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.scheduledFunction = functions.pubsub
  .schedule("every 10 minutes")
  .onRun(async (context) => {
    console.log("This will be run every 10 minute!");
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        await doScrape();
        resolve(void);
      }, _.random(2000, 15000));
    });
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

import express = require("express");
import cors = require("cors");

function wrapCors(cb: any) {
  const app = express();

  app.use(cors({ origin: true }));

  app.get("/", cb);
  return app;
}

const firestore = admin.firestore();

exports.objects = functions.https.onRequest(
  wrapCors(async (req: express.Request, res: express.Response) => {
    const { label, newestSeen, oldestSeen, limit } = req.query;
    // const orderField = "added_at";
    // const orderField = "taken_at";
    const orderField = "extracted_at";

    console.log(req.query);

    let query: admin.firestore.Query<admin.firestore.DocumentData> = firestore.collection(
      "objects"
    );

    if (label) {
      query = query.where("label", "==", label);
    }

    if (newestSeen) {
      const newDate = new Date(parseInt(newestSeen as string) * 1000);
      console.log({ newDate });
      query = query.where(orderField, ">", newDate);
    }

    let snapshot = await query
      .orderBy(orderField, "desc")
      .limit(parseInt((limit as string) || "100"))
      .get();

    console.log("num docs: ", snapshot.docs.length);

    if (snapshot.docs.length === 0 && oldestSeen) {
      console.log("rerunning from the bottom, ", oldestSeen);
      query = firestore.collection("objects");

      if (label) {
        query = query.where("label", "==", label);
      }

      if (oldestSeen) {
        const oldDate = new Date(parseInt(oldestSeen as string) * 1000);
        console.log({ oldDate });

        query = query.where(orderField, "<", oldDate);
      }

      snapshot = await query
        .orderBy(orderField, "desc")
        .limit(parseInt((limit as string) || "100"))
        .get();
    }

    const objects = snapshot.docs.map((d) => d.data());
    res.json({
      objects,
      newestSeen: _.max(objects.map((o) => o[orderField]._seconds)),
      oldestSeen: _.min(objects.map((o) => o[orderField]._seconds)),
    });
  })
);

exports.images = functions.https.onRequest(
  wrapCors(async (req: Express.Request, res: any) => {
    const snapshot = await firestore
      .collection("discover")
      .where("needsSegmentation", "==", false)
      .orderBy("added_at", "desc")
      .limit(100)
      .get();
    const objects = snapshot.docs.map((d) => d.data());
    res.json({
      objects,
    });
  })
);
