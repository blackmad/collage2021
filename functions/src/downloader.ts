/* eslint-disable import/no-unassigned-import */
// import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// eslint-disable-next-line no-duplicate-imports
import 'firebase-functions';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { download } from './download';

const bucket = admin.storage().bucket('collage2021-e8687.appspot.com');

export async function doDownloadUpload({
  url,
  id,
}: {
  url: string;
  id: string;
}) {
  const fileName = `${id}.png`;
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const metadata = {
    contentType: 'image/png',
  };
  await download(url, tempFilePath);

  console.log('Image downloaded locally to', tempFilePath);

  const destination = `raw/${fileName}`;
  await bucket.upload(tempFilePath, {
    destination,
    metadata: metadata,
  });
  // Once the thumbnail has been uploaded delete the local file to free up disk space.
  fs.unlinkSync(tempFilePath);

  return destination;
}
