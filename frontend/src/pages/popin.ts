import '../styles/style.scss';
import * as PIXI from 'pixi.js';
import * as _ from 'lodash';
import { ease } from 'pixi-ease';
import { makeApp } from '../util/pixijs-utils';
import { OneAtATimeLoader } from '../util/OneAtATimeLoader';

function popIn(texture: PIXI.Texture) {
  const s = new PIXI.Sprite(texture);
  s.anchor.set(0.5);
  s.x = _.random(0, app.renderer.width);
  s.y = _.random(0, app.renderer.height);
  app.stage.addChild(s);
}

const app = makeApp();
const container = new PIXI.Container();
app.stage.addChild(container);

new OneAtATimeLoader({ app, refreshRate: 750, cb: popIn }).start();
