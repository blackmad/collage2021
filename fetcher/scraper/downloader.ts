import * as fs from 'fs';
import * as _ from 'lodash';
import * as http from 'http';

import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import Bluebird = require('bluebird');
import { download } from './download';

const outputDir = 'raw';
fs.mkdirSync(outputDir, { recursive: true });

async function doSelect() {
  // this is a top-level await
  const db = await open({
    filename: 'db.sqlite',
    driver: sqlite3.Database,
  });

  db.run(`CREATE TABLE IF NOT EXISTS downloaded (
    id TEXT PRIMARY KEY,
    downloaded_at DATETIME
)`);

  const sql = `SELECT id, url FROM discover WHERE datetime(inserted_at) >= datetime('now', '-1 hours')`;

  const rows = await db.all(sql);
  //   console.log('rows', rows);
  Bluebird.map(
    rows,
    async (row) => {
      const { url, id } = row;
      const outputFile = `${outputDir}/${id}.jpg`;

      const sql2 = `SELECT COUNT(*) as count FROM downloaded WHERE id="${id}"`;
      const rows = await db.all(sql2);
      if (rows[0]['count'] > 0) {
        return;
      }
      await download(url, outputFile);
      console.log(outputFile);
      await db.exec(
        `INSERT or IGNORE INTO downloaded (id, downloaded_at) VALUES ("${id}", datetime('now'))`
      );
    },
    { concurrency: 3 }
  );
}

doSelect();
