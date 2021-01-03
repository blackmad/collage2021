import '../styles/style.scss';
import * as PIXI from 'pixi.js';
import * as _ from 'lodash';
import { ease } from 'pixi-ease';
import { makeApp, makeSpriteInteractive } from '../util/pixijs-utils';
import { OneAtATimeLoader } from '../util/OneAtATimeLoader';
import { ObjectFragment } from '../util/objectFetcher';

const easings = [
  'easeInQuad',
  'easeOutQuad',
  'easeInOutQuad',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
  'easeInQuart',
  'easeOutQuart',
  'easeInOutQuart',
  'easeInQuint',
  'easeOutQuint',
  'easeInOutQuint',
  'easeInSine',
  'easeOutSine',
  'easeInOutSine',
  'easeInExpo',
  'easeOutExpo',
  'easeInOutExpo',
  'easeInCirc',
  'easeOutCirc',
  'easeInOutCirc',
  'easeInElastic',
  'easeOutElastic',
  'easeInOutElastic',
  'easeInBack',
  'easeOutBack',
  'easeInOutBack',
  'easeInBounce',
  'easeOutBounce',
  'easeInOutBounce',
];
const defaultEasing = _.sample(easings);

function makeRibbon(texture: PIXI.Texture, object: ObjectFragment) {
  const startY =
    Math.random() * (app.renderer.height + texture.height) - texture.height / 2;

  const repeats = _.random(1, 20);
  const tileWidth =
    Math.floor(app.renderer.width / texture.width) * texture.width * repeats;
  // (4 + Math.random() * 10);
  const tiledSprite = new PIXI.TilingSprite(texture, tileWidth, texture.height);
  tiledSprite.y = startY;
  tiledSprite.x = -tileWidth;
  app.stage.addChild(tiledSprite);

  const duration = 7000 + 2000 * repeats + _.random(20000);
  const easeInstance = ease.add(
    tiledSprite,
    {
      x: tileWidth,
    },
    { reverse: false, duration, ease: defaultEasing }
  );

  easeInstance.on('complete', () => {
    tiledSprite.destroy();
  });

  makeSpriteInteractive(app, tiledSprite, object);

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
