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
import Bluebird = require("bluebird");
// admin.initializeApp();

const firestore = admin.firestore();
firestore.settings({ ignoreUndefinedProperties: true });

const bigInt = require("big-integer");

function getShortcodeFromTag(tag: string) {
  let id = bigInt(tag.split("_", 1)[0]);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let shortcode = "";

  while (id.greater(0)) {
    const division = id.divmod(64);
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

const Flickr = require("flickr-sdk");

const flickr = new Flickr(functions.config().flickr.api_key);

function saveDocs(
  entries: {
    id: string;
    source: string;
    url: string;
    originalUrl: string;
    taken_at: Date;
  }[]
) {
  function makeId(entry: { id: string; source: string }) {
    return `${entry.id}-${entry.source}`;
  }

  return Bluebird.map(
    entries,
    async (entry) => {
      const id = makeId(entry);
      const doc = await firestore.collection("discover").doc(id).get();
      if (doc.exists) {
        return;
      }

      console.log(`writing ${id}`);

      return firestore.collection("discover").doc(id).set(entry);
    },
    { concurrency: 5 }
  );
}

export function doFlickrScrape() {
  if (!flickr) {
    return;
  }

  return flickr.photos
    .getRecent({
      page: 1,
      per_page: 500,
      extras: "url_o,date_taken,date_upload",
    })
    .then((res: any) => {
      console.log(res);
      const { body } = res;
      const { photos } = body;

      console.log(photos);
      const entries = photos.photo.map((photo: any) => {
        const { id, url_o, datetaken, dateupload } = photo;
        console.log({ id, url_o, datetaken, dateupload });

        return {
          id,
          url: url_o,
          originalUrl: `http://flickr.com/photo.gne?id=${id}`,
          taken_at: new Date(parseInt(dateupload) * 1000),
          source: "flickr",
        };
      });
      return saveDocs(entries);
    });
}

import * as tumblr from "tumblr.js";
const client = tumblr.createClient({
  consumer_key: functions.config().tumblr.api_key,
  consumer_secret: functions.config().tumblr.api_key,
});

import cheerio = require("cheerio");
const TAGS = [
  "photography",
  "food",
  "streetphotography",
  "fashion",
  "cars",
  "dogs",
  "cats",
  "pets",
];

import * as util from "util";

export async function doScrapeTumblr() {
  const entries: any[] = [];

  async function getPage(tag: string, page: number) {
    const resp = (await taggedPosts("photography", { page })) as any[];

    resp.forEach((post: any) => {
      console.log(post);
      // console.log(post.body)
      if (!post.body) {
        return;
      }
      const { id, timestamp, post_url } = post;
      const $ = cheerio.load(post.body);
      $("img").map((index, img) => {
        const src = $(img).attr("src");
        entries.push({
          id,
          url: src,
          originalUrl: post_url,
          taken_at: new Date(timestamp * 1000),
          source: "flickr",
        });
      });
    });
  }

  const taggedPosts = util.promisify(
    (tag: string, options: any, cb: Function) =>
      client.taggedPosts(tag, options, (err, ...results) => cb(err, results))
  );

  await Bluebird.map(
    TAGS,
    async (tag) => {
      await getPage(tag, 1);
      await getPage(tag, 2);
    },
    { concurrency: 1 }
  );

  await saveDocs(entries);
}
