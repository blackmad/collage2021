import '../styles/style.scss';
import * as PIXI from 'pixi.js';
import * as _ from 'lodash';
import { ease } from 'pixi-ease';
import { makeApp } from '../util/pixijs-utils';
import { OneAtATimeLoader } from '../util/OneAtATimeLoader';
import { gui } from '../util/gui';

const params = {
  twinkleBug: false,
};

gui.add(params, 'twinkleBug');

function mandala1(texture: PIXI.Texture) {
  const s = new PIXI.Sprite(texture);
  //
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

  const cellWidth = app.renderer.width / cols;
  const cellHeight = app.renderer.height / rows;

  //   console.log(cols, rows, cellWidth, cellHeight);

  const x = cols === 1 ? app.renderer.width / 2 : _.random(0, cellWidth, true);
  const y =
    rows === 1 ? app.renderer.height / 2 : _.random(0, cellHeight, true);

  //   console.log(rows, cols);
  //   console.log({ x });

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

  const duration = 2000 + _.random(10000);
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

      sprite.blendMode = PIXI.BLEND_MODES.COLOR_DODGE;

      //   console.log({ c, r });

      if (c % 2 === 0) {
        sprite.x = c * cellWidth + x;
      } else {
        sprite.x = (c + 1) * cellWidth - x;
        // sprite.x -= sprite.width / 2;
        // sprite.scale.x = -1;
      }
      //   console.log({ sx: sprite.x });

      if (r % 2 === 0) {
        sprite.y = r * cellHeight + y;
      } else {
        sprite.y = (r + 1) * cellHeight - y;
        // sprite.y -= sprite.height / 2;
        // sprite.scale.y = -1;
      }

      sprite.alpha = 0;

      ease
        .add(
          sprite,
          {
            alpha: 1.0,
          },
          {
            reverse: true,
            duration: params.twinkleBug ? 2000 + _.random(10000) : duration,
            ease: 'easeInQuad',
          }
        )
        .once('complete', () => {
          if (params.twinkleBug) {
            setTimeout(() => {
              sprite.destroy({ texture: true, baseTexture: true });
              texture.destroy(true);
              xFlipTexture.destroy(true);
              yFlipTexture.destroy(true);
              doubleFlipTexture.destroy(true);
            }, 30000);
          } else {
            sprite.destroy({ texture: true, baseTexture: true });
            texture.destroy(true);
            xFlipTexture.destroy(true);
            yFlipTexture.destroy(true);
            doubleFlipTexture.destroy(true);
          }
        });

      app.stage.addChild(sprite);
    }
  }
}

const app = makeApp();
const container = new PIXI.Container();
app.stage.addChild(container);

new OneAtATimeLoader({
  app,
  refreshRate: 1500,
  cb: mandala1,
}).start();
