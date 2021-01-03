import * as PIXI from 'pixi.js';

import { Ease } from 'pixi-ease';
import { app } from 'firebase-functions';

export const ease = new Ease({ ticker: PIXI.Ticker.shared });

export function makeApp() {
  const app = new PIXI.Application({ transparent: true });
  app.renderer.view.style.position = 'absolute';
  app.renderer.view.style.display = 'block';
  (app.renderer as any).autoResize = true;
  app.renderer.resize(window.innerWidth, window.innerHeight);
  document.body.appendChild(app.view);

  let tickerRunning = true;
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
    },
    false
  );

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
