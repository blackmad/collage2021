import * as PIXI from 'pixi.js';

import { Ease } from 'pixi-ease';
import { ObjectFragment } from './objectFetcher';
import { gui } from './gui';

var bigInt = require('big-integer');

function getShortcodeFromTag(tag: string) {
  let id = bigInt(tag.split('_', 1)[0]);
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let shortcode = '';

  while (id.greater(0)) {
    let division = id.divmod(64);
    id = division.quotient;
    shortcode = `${alphabet.charAt(division.remainder)}${shortcode}`;
  }

  return shortcode;
}

export const ease = new Ease({ ticker: PIXI.Ticker.shared });

export function makeApp() {
  const app = new PIXI.Application({ transparent: true });
  app.renderer.view.style.position = 'absolute';
  app.renderer.view.style.display = 'block';
  (app.renderer as any).autoResize = true;
  app.renderer.resize(window.innerWidth, window.innerHeight);
  document.body.appendChild(app.view);

  let tickerRunning = true;
  let guiShown = true;

  window.addEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key === ' ') {
        if (tickerRunning) {
          app.ticker.stop();
        } else {
          app.ticker.start();
        }
        tickerRunning = !tickerRunning;
      }

      if (event.key === 'd') {
        if (guiShown) {
          gui.hide();
        } else {
          gui.show();
          app.ticker.start();
        }
        guiShown = !guiShown;
      }
    },
    false
  );

  const textContainer = new PIXI.Container();
  const text = new PIXI.Text('Be patient.', {
    fontFamily: 'Garamond',
    fontSize: 48,
    fill: 0xd1d1d1,
    align: 'center',
  });
  app.stage.addChild(text);
  text.anchor.set(0.5);
  text.position.x = app.renderer.width / 2;
  text.position.y = app.renderer.height / 2;

  ease
    .add(
      text,
      {
        alpha: 0.0,
      },
      {
        reverse: true,
        duration: 4000,
        ease: 'easeInBack',
      }
    )
    .once('complete', () => {
      text.destroy();
    });

  const text2 = new PIXI.Text('Space bar to pause, d to hide GUI.', {
    fontFamily: 'Garamond',
    fontSize: 24,
    fill: 0xd1d1d1,
    align: 'center',
  });

  app.stage.addChild(text2);
  text2.anchor.set(0.5);
  text2.position.x = app.renderer.width / 2;
  text2.position.y = (app.renderer.height * 2) / 3;

  ease
    .add(
      text2,
      {
        alpha: 0.0,
      },
      {
        reverse: true,
        duration: 4000,
        ease: 'easeInBack',
      }
    )
    .once('complete', () => {
      text2.destroy();
    });

  // window.onresize = () => window.location.reload();

  return app;
}

export function setTickerInterval(
  app: PIXI.Application,
  cb: CallableFunction,
  ms: number
) {
  let elapsedTime = 0;

  app.ticker.add((deltaTime: number) => {
    // console.log(deltaTimeMs);
    elapsedTime += deltaTime * (1000 / 60);
    if (elapsedTime > ms) {
      cb();
      elapsedTime -= ms;
    }
  });
}

export function setTickerTimeout(
  app: PIXI.Application,
  ms: number,
  cb: CallableFunction
) {
  let elapsedTime = 0;

  const updateFn = (deltaTime: number) => {
    // console.log(deltaTimeMs);
    elapsedTime += deltaTime * (1000 / 60);
    if (elapsedTime > ms) {
      cb();
      app.ticker.remove(updateFn);
    }
  };

  app.ticker.add(updateFn);
}

export function makeSpriteInteractive(
  app: PIXI.Application,
  s: PIXI.Sprite,
  object: ObjectFragment
) {
  s.interactive = true;

  // create hit area, needed for interactivity
  // s.hitArea = new PIXI.Circle(150, 150, 100);

  let text: PIXI.Text;
  s.addListener('mouseover', () => {
    // s.tint = 0xff0000;

    text = new PIXI.Text(`${object.label} (${object.score.toFixed(2)})`, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xff1010,
      align: 'center',
    });
    text.anchor.set(0.5);
    text.x = s.x;
    text.y = s.y;
    app.stage.addChild(text);
  });

  s.addListener('mouseout', () => {
    s.tint = 0xffffff;
    if (text) {
      text.destroy();
    }
  });

  const onDown = () => {
    window.open(
      'https://www.instagram.com/p/' + getShortcodeFromTag(object.id)
    );
  };

  s.addListener('mousedown', onDown);
  s.addListener('touchstart', onDown);
}
