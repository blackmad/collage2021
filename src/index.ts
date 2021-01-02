import './styles/style.scss';
import * as PIXI from 'pixi.js';
// import { Kaleidoscope } from './Kaleidoscope';
import { files } from './files';
import { Kaleidoscope } from './Kaleidoscope';

console.log('hello, world');

const testMessage = 'TypeScript works';

console.log(testMessage);

const app = new PIXI.Application({ transparent: true });
app.renderer.view.style.position = 'absolute';
app.renderer.view.style.display = 'block';
(app.renderer as any).autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);

const width = 600;
const height = 600;

const renderTexture = PIXI.RenderTexture.create({ width, height });
// const renderSprite = new PIXI.Sprite(renderTexture);
// app.stage.addChild(renderSprite);

const container = new PIXI.Container();

const loader = new PIXI.Loader();
for (let i = 0; i < files.length; i++) {
  loader.add('objects/' + files[i]);
}
loader.onComplete.add(handleLoadComplete);
loader.load();

function handleLoadComplete() {
  for (let i = 0; i < files.length; i++) {
    const texture = loader.resources['objects/' + files[i]].texture;

    const sprite = new PIXI.Sprite(texture);

    sprite.x = Math.random() * renderTexture.width;
    sprite.y = Math.random() * renderTexture.height;
    container.addChild(sprite);
    // app.stage.addChild(sprite);

    const alphaSpeed = 1000;
    let count = Math.random() > 0.5 ? alphaSpeed : 0;
    app.ticker.add((time: number) => {
      count += 1;
      sprite.alpha = Math.sin(count / alphaSpeed);
      // console.log(time);
      // sprite.alpha =
    });
  }

  app.ticker.add((time: number) => {
    app.renderer.render(container, renderTexture);
  });

  const kaleidoscope = new Kaleidoscope(app, renderTexture);
  kaleidoscope.draw();
}
