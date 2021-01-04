/* eslint-disable import/no-unassigned-import */
/* eslint-disable no-duplicate-imports */
import {
  IgApiClient,
  TopicalExploreFeedResponseCarouselMediaItem,
  TopicalExploreFeedResponseMedia,
} from "instagram-private-api";
import * as _ from "lodash";

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import "firebase-functions";
// admin.initializeApp();

const firestore = admin.firestore();
firestore.settings({ ignoreUndefinedProperties: true });

var bigInt = require("big-integer");

function getShortcodeFromTag(tag: string) {
  let id = bigInt(tag.split("_", 1)[0]);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let shortcode = "";

  while (id.greater(0)) {
    let division = id.divmod(64);
    id = division.quotient;
    shortcode = `${alphabet.charAt(division.remainder)}${shortcode}`;
  }

  return shortcode;
}

async function fakeSave(data: any) {
  // console.log(data);(a)
  await firestore
    .collection("login-creds")
    .doc("creds")
    .set({ value: JSON.stringify(data) });
}

async function fakeExists(): Promise<boolean> {
  const creds = await firestore.collection("login-creds").doc("creds").get();
  console.log("creds", creds);
  return creds.exists;
}

async function fakeLoad(): Promise<string | undefined> {
  console.log("using cached");
  return await (
    await firestore.collection("login-creds").doc("creds").get()
  ).data()?.value;
}

export async function doScrape() {
  const ig = new IgApiClient();

  async function forceLogin() {
    // This call will provoke request.end$ stream
    await ig.simulate.preLoginFlow();
    await ig.account.login(
      functions.config().instagram.username,
      functions.config().instagram.password
    );
    process.nextTick(async () => await ig.simulate.postLoginFlow());
  }

  async function doLogin() {
    console.log("username", functions.config().instagram.username);
    ig.state.generateDevice(functions.config().instagram.username);
    // This function executes after every request
    ig.request.end$.subscribe(async () => {
      const serialized = await ig.state.serialize();
      delete serialized.constants; // this deletes the version info, so you'll always use the version provided by the library
      await fakeSave(serialized);
    });
    if (await fakeExists()) {
      // import state accepts both a string as well as an object
      // the string should be a JSON object
      await ig.state.deserialize(await fakeLoad());
    } else {
      // Most of the time you don't have to login after loading the state
      await forceLogin();
    }
  }

  async function logMedia(
    media:
      | TopicalExploreFeedResponseMedia
      | TopicalExploreFeedResponseCarouselMediaItem,
    taken_at: number
  ) {
    if (!media.image_versions2?.candidates) {
      console.log(media);
      return;
    }
    const candidates = media.image_versions2.candidates;
    const best = _.maxBy(candidates, (c) => c.width);
    // we really want the 1080 images
    if (best?.width || 0 < 400) {
      return;
    }
    const url = best?.url;
    const id = media.id;
    //   console.log(media);

    await firestore
      .collection("discover")
      .doc(id)
      .set(
        {
          id,
          url,
          originalUrl: "https://www.instagram.com/p/" + getShortcodeFromTag(id),
          taken_at: new Date(taken_at * 1000),
          added_at: admin.firestore.Timestamp.now(),
          needsDownload: true,
          needsSegmentation: true,
          source: "instagram",
        },
        { merge: true }
      );
  }

  const MAX_PAGES_PER_QUERY = 10;

  async function getDiscover() {
    const discoverFeed = ig.feed.topicalExplore();
    let layoutSections = await discoverFeed.items();
    let page = 0;
    while (layoutSections?.length > 0 && page < MAX_PAGES_PER_QUERY) {
      await Promise.all(
        layoutSections.flatMap((layoutSection) => {
          layoutSection.layout_content.fill_items?.flatMap((fillItem) => {
            if (
              fillItem.media.carousel_media &&
              fillItem.media.carousel_media?.length > 0
            ) {
              return fillItem.media.carousel_media.map((carouselMedia) => {
                return logMedia(carouselMedia, fillItem.media.taken_at);
              });
            } else if (fillItem.media) {
              return logMedia(fillItem.media, fillItem.media.taken_at);
            } else {
              return Promise.resolve(0);
            }
          });
        })
      );
      layoutSections = await discoverFeed.items();
      page += 1;
    }
  }

  await doLogin();
  await getDiscover();
}
