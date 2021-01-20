import '../styles/style.scss';
import * as PIXI from 'pixi.js';
import * as _ from 'lodash';
import { ease } from 'pixi-ease';
import { makeApp } from '../util/pixijs-utils';
import {
  FetchedObjectWithDoneCallback,
  OneAtATimeLoader,
} from '../util/OneAtATimeLoader';
import { gui } from '../util/gui';
import { ObjectFragment } from '../util/objectFetcher';

const params = {
  minDuration: 5000,
  maxDuration: 20000,
  maxPercentageOfCell: 200,
  minPercentageOfCell: 20,
};

gui.add(params, 'minDuration');
gui.add(params, 'maxDuration');
gui.add(params, 'maxPercentageOfCell');
gui.add(params, 'minPercentageOfCell');

function mandala1({ texture, object, done }: FetchedObjectWithDoneCallback) {
  let cols = _.random(0, 5) * 2;
  let rows = _.random(0, 5) * 2;

  if (cols === 0) {
    cols = 1;
  }
  if (rows === 1) {
    rows = 1;
  }

  if (cols === 1 && rows === 1) {
    if (Math.random() > 0.5) {
      cols = 2;
    } else {
      rows = 2;
    }
  }

  const possibleChangePercentage = _.random(
    params.minPercentageOfCell / 100,
    params.maxPercentageOfCell / 100
  );

  const cellWidth = app.renderer.width / cols;
  const cellHeight = app.renderer.height / rows;

  const x = cols === 1 ? app.renderer.width / 2 : _.random(0, cellWidth, true);
  const y =
    rows === 1 ? app.renderer.height / 2 : _.random(0, cellHeight, true);

  const xFlipTexture = new PIXI.Texture(
    texture.baseTexture,
    texture.frame,
    null,
    null,
    PIXI.groupD8.MIRROR_HORIZONTAL
  );

  const yFlipTexture = new PIXI.Texture(
    texture.baseTexture,
    texture.frame,
    null,
    null,
    PIXI.groupD8.MIRROR_VERTICAL
  );

  const doubleFlipTexture = new PIXI.Texture(
    xFlipTexture.baseTexture,
    xFlipTexture.frame,
    null,
    null,
    PIXI.groupD8.MIRROR_VERTICAL
  );

  const renderTexture = PIXI.RenderTexture.create({
    width: app.renderer.width,
    height: app.renderer.height,
  });

  const duration =
    params.minDuration + _.random(params.maxDuration - params.minDuration);
  for (let r = 0; r < rows; ++r) {
    for (let c = 0; c < cols; ++c) {
      let tmpTexture: PIXI.Texture = texture;

      if (c % 2 == 1) {
        tmpTexture = xFlipTexture;
      }

      if (r % 2 === 1) {
        tmpTexture = yFlipTexture;
      }

      if (r % 2 === 1 && c % 2 === 1) {
        tmpTexture = doubleFlipTexture;
      }

      const sprite = new PIXI.Sprite(tmpTexture);
      sprite.anchor.set(0.5);

      // let's maybe scale the size of this
      const newWidth = possibleChangePercentage * cellWidth;
      const newHeight = sprite.height * (newWidth / sprite.width);
      if (newWidth < sprite.width && newHeight < sprite.height) {
        sprite.width = newWidth;
        sprite.height = newHeight;
      }

      sprite.blendMode = PIXI.BLEND_MODES.COLOR_DODGE;

      if (c % 2 === 0) {
        sprite.x = c * cellWidth + x;
      } else {
        sprite.x = (c + 1) * cellWidth - x;
      }

      if (r % 2 === 0) {
        sprite.y = r * cellHeight + y;
      } else {
        sprite.y = (r + 1) * cellHeight - y;
      }

      // sprite.alpha = 0;

      app.renderer.render(sprite, renderTexture, false);
      sprite.destroy();
    }
  }

  texture.destroy(true);
  xFlipTexture.destroy(true);
  yFlipTexture.destroy(true);
  doubleFlipTexture.destroy(true);
  const renderSprite = new PIXI.Sprite(renderTexture);
  renderSprite.alpha = 0;
  app.stage.addChild(renderSprite);

  ease
    .add(
      renderSprite,
      {
        alpha: 1.0,
        // shake: 20,
      },
      {
        reverse: true,
        duration,
        ease: 'easeInQuad',
      }
    )
    .once('complete', () => {
      renderSprite.destroy({ texture: true, baseTexture: true });
      done();
    });
}

const app = makeApp();
const container = new PIXI.Container();
app.stage.addChild(container);

new OneAtATimeLoader({
  app,
  initialRefreshRate: 1500,
  cb: mandala1,
}).start();
