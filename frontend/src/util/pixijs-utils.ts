import * as PIXI from 'pixi.js';

export function makeApp() {
  const app = new PIXI.Application({ transparent: true });
  app.renderer.view.style.position = 'absolute';
  app.renderer.view.style.display = 'block';
  (app.renderer as any).autoResize = true;
  app.renderer.resize(window.innerWidth, window.innerHeight);
  document.body.appendChild(app.view);
  return app;
}
