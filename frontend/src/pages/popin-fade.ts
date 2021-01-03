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
  s.alpha = 0.0;

  const easeInstance = ease.add(
    s,
    {
      alpha: 1.0,
    },
    { reverse: false, duration: 2, ease: 'easeInOutQuad' }
  );

  app.stage.addChild(s);
}

const app = makeApp();
const container = new PIXI.Container();
app.stage.addChild(container);

new OneAtATimeLoader({ refreshRate: 1000, cb: popIn }).start();
