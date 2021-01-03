import '../styles/style.scss';
import * as PIXI from 'pixi.js';
import * as _ from 'lodash';
import { ease } from 'pixi-ease';
import { makeApp } from '../util/pixijs-utils';
import { OneAtATimeLoader } from '../util/OneAtATimeLoader';

function makeRibbon(texture: PIXI.Texture) {
  const startY =
    Math.random() * (app.renderer.height + texture.height) - texture.height / 2;
  const tileWidth =
    Math.floor(app.renderer.width / texture.width) * texture.width * 4;
  // (4 + Math.random() * 10);
  const tiledSprite = new PIXI.TilingSprite(texture, tileWidth, texture.height);
  tiledSprite.y = startY;
  tiledSprite.x = -tileWidth;
  app.stage.addChild(tiledSprite);

  const duration = 7000 + 10000 * Math.random();
  const easeInstance = ease.add(
    tiledSprite,
    {
      x: tileWidth,
    },
    { reverse: false, duration, ease: 'easeInOutQuad' }
  );

  easeInstance.on('complete', () => {
    tiledSprite.destroy();
  });

  // const baseMoveSpeed =
  //   0.25 + 0.75 * Math.random() * (Math.random() > 0.5 ? 1 : -1);
  // containerWrappedTicker(tiledSprite, () => {
  //   // sprite.alpha = Math.sin(count / alphaSpeed);
  //   tiledSprite.tilePosition.x += baseMoveSpeed;
  // });

  return tiledSprite;
}

const app = makeApp();
const container = new PIXI.Container();
app.stage.addChild(container);

new OneAtATimeLoader({ app, refreshRate: 750, cb: makeRibbon }).start();
