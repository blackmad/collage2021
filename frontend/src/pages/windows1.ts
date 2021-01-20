import { Delaunay } from 'd3-delaunay';
import { makeApp } from '../util/pixijs-utils';
import * as PIXI from 'pixi.js';
import * as _ from 'lodash';
import {
  FetchedObjectWithDoneCallback,
  OneAtATimeLoader,
} from '../util/OneAtATimeLoader';
import { ObjectFragment } from '../util/objectFetcher';

const app = makeApp();

const numPoints = 100;

const points = _.times(numPoints).map(() => {
  const x = _.random(app.renderer.width);
  const y = _.random(app.renderer.height);
  return [x, y];
});

const delaunay = Delaunay.from(points);
const voronoi = delaunay.voronoi([
  0,
  0,
  app.renderer.width,
  app.renderer.height,
]);

const polygonPoints: PIXI.Point[][] = [];

for (const cell of voronoi.cellPolygons()) {
  console.log(cell);
  const graphics = new PIXI.Graphics();
  graphics.lineStyle(10, 0xffd900, 1);

  const pixiPoints = cell.map((p) => new PIXI.Point(p[0], p[1]));
  polygonPoints.push(pixiPoints);

  const polygon = graphics.drawPolygon(pixiPoints);
  app.stage.addChild(polygon);
  console.log(polygon);
}

function windows1({ texture, object, done }: FetchedObjectWithDoneCallback) {
  const cell = polygonPoints.pop();

  const graphics = new PIXI.Graphics();
  graphics.beginTextureFill({ texture });
  const polygon = graphics.drawPolygon(cell);
  app.stage.addChild(polygon);
  console.log(polygon);
}

new OneAtATimeLoader({
  app,
  initialRefreshRate: 1500,
  cb: windows1,
}).start();
