// import * as fs from 'fs';
// import * as _ from 'lodash';

// import Bluebird = require('bluebird');
// import { download } from './download';

// async function doSelect() {

//   const rows = await db.all(sql);
//   //   console.log('rows', rows);
//   await Bluebird.map(
//     rows,
//     async (row) => {
//       const { url, id } = row;
//       const outputFile = `${outputDir}/${id}.jpg`;

//       const sql2 = `SELECT COUNT(*) as count FROM downloaded WHERE id="${id}"`;
//       const rows = await db.all(sql2);
//       if (rows[0]['count'] > 0) {
//         return;
//       }
//       await download(url, outputFile);
//       console.log(outputFile);
//       await db.exec(
//         `INSERT or IGNORE INTO downloaded (id, downloaded_at) VALUES ("${id}", datetime('now'))`
//       );
//     },
//     { concurrency: 3 }
//   );
// }

// doSelect();
