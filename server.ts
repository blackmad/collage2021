import * as express from 'express';
import * as cors from 'cors';

import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function startServer() {
  const db = await open({
    filename: 'fetcher/scraper/db.sqlite',
    driver: sqlite3.Database,
  });

  const app = express();
  app.use(cors());

  app.get('/', (request, response) => {
    response.send('Hello world!');
  });

  app.get('/objects/recent', (request, response) => {
    const { objectType } = request.query;
    const sql = `SELECT * FROM objects WHERE width > 150 AND height > 150 AND score > 0.85`;
    db.all(sql).then((r) => response.json(r));
  });

  app.use('/objects', express.static('fetcher/extractor/objects'));

  app.listen(5000);
}

startServer();
