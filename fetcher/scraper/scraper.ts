import 'dotenv/config';
import {
  IgApiClient,
  TopicalExploreFeedResponseCarouselMediaItem,
  TopicalExploreFeedResponseMedia,
} from 'instagram-private-api';
import * as fs from 'fs';
import * as _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as sqlite3 from 'sqlite3';
// const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');

db.run(`CREATE TABLE IF NOT EXISTS discover (
    id TEXT PRIMARY KEY,
    url TEXT,
    taken_at DATETIME
)`);

function fakeSave(data: any) {
  //   console.log(data);
  fs.writeFileSync('session.json', JSON.stringify(data));
  return data;
}

function fakeExists() {
  return fs.existsSync('session.json');
}

function fakeLoad() {
  console.log('using cached');
  return JSON.parse(fs.readFileSync('session.json').toString());
}

const ig = new IgApiClient();

async function forceLogin() {
  // This call will provoke request.end$ stream
  await ig.simulate.preLoginFlow();
  await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
  process.nextTick(async () => await ig.simulate.postLoginFlow());
}

async function doLogin() {
  console.log(process.env.IG_USERNAME);
  ig.state.generateDevice(process.env.IG_USERNAME);
  ig.state.proxyUrl = process.env.IG_PROXY;
  // This function executes after every request
  ig.request.end$.subscribe(async () => {
    const serialized = await ig.state.serialize();
    delete serialized.constants; // this deletes the version info, so you'll always use the version provided by the library
    fakeSave(serialized);
  });
  if (fakeExists()) {
    // import state accepts both a string as well as an object
    // the string should be a JSON object
    await ig.state.deserialize(fakeLoad());
  } else {
    // Most of the time you don't have to login after loading the state
    await forceLogin();
  }
}

const insertStatement = db.prepare(
  'INSERT or IGNORE INTO discover (id, url, taken_at) VALUES (?, ?, ?)'
);

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
  const url = best.url;
  const id = media.id;
  //   console.log(media);

  try {
    await insertStatement.run(id, url, taken_at);
    console.log('inserted ', id);
  } catch {
    // assume this is a primary key failure and ignore
    console.log('skipped ', id);
  }
}

const MAX_PAGES_PER_QUERY = 10;

async function getDiscover() {
  const discoverFeed = ig.feed.topicalExplore();
  let layoutSections = await discoverFeed.items();
  let page = 0;
  while (layoutSections?.length > 0 && page < MAX_PAGES_PER_QUERY) {
    layoutSections.forEach((layoutSection) => {
      layoutSection.layout_content.fill_items?.forEach((fillItem) => {
        if (fillItem.media.carousel_media?.length > 0) {
          fillItem.media.carousel_media.forEach((carouselMedia) => {
            logMedia(carouselMedia, fillItem.media.taken_at);
          });
        } else if (fillItem.media) {
          logMedia(fillItem.media, fillItem.media.taken_at);
        }
      });
    });
    layoutSections = await discoverFeed.items();
    page += 1;
  }
}

doLogin();
getDiscover();
