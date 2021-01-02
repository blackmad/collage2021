/*
TODO
- stream in new images
- make the image column fit the slice a little better
- kill sprites when they are entirely offscreen
*/

import './styles/style.scss';
import * as PIXI from 'pixi.js';
import { files } from './files';
// import { Kaleidoscope } from './Kaleidoscope';
import * as _ from 'lodash';

console.log('hello, world');

const testMessage = 'TypeScript works';

console.log(testMessage);

const app = new PIXI.Application({ transparent: true });
app.renderer.view.style.position = 'absolute';
app.renderer.view.style.display = 'block';
(app.renderer as any).autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);

const width = 1500;
const height = 800;

const renderTexture = PIXI.RenderTexture.create({ width, height });

const container = new PIXI.Container();

const loader = new PIXI.Loader();

app.stage.addChild(container);

type ImageObject = any;
let objects: ImageObject[] = [];

async function updateObjects() {
  const newObjects = await (
    await fetch('http://localhost:5000/objects/recent')
  ).json();
  console.log(newObjects);
  objects = [...objects, ...newObjects];
}

const containerTickers: Map<PIXI.Container, (() => any)[]> = new Map();

function containerWrappedTicker(container: PIXI.Container, cb: () => any) {
  containerTickers.set(container, [
    ...(containerTickers.get(container) || []),
    cb,
  ]);

  app.ticker.add(cb);
}

function destroyContainer(container: PIXI.Container) {
  (containerTickers.get(container) || []).forEach((cb) => {
    app.ticker.remove(cb);
  });
  container.destroy();
}

function makeRibbon(texture: PIXI.Texture) {
  const startY = Math.random() * app.renderer.height - texture.height;
  const tiledSprite = new PIXI.TilingSprite(
    texture,
    app.renderer.width,
    texture.height
  );
  tiledSprite.y = startY;
  app.stage.addChild(tiledSprite);

  const baseMoveSpeed = 0.25 + 0.75 * Math.random();
  containerWrappedTicker(tiledSprite, () => {
    // sprite.alpha = Math.sin(count / alphaSpeed);
    tiledSprite.tilePosition.x += baseMoveSpeed;
  });

  return tiledSprite;
}

function wrapInFade(container: PIXI.Container) {
  const timeOnScreenSeconds = 5 + 10 * Math.random();
  const timeInFrames = timeOnScreenSeconds * 60;

  let count = 0;
  const fader = (deltaTime: number) => {
    count += deltaTime;
    container.alpha = Math.sin((Math.PI * count) / timeInFrames);
    if (count >= timeInFrames) {
      app.ticker.remove(fader);
      destroyContainer(container);
    }
  };
  app.ticker.add(fader);
}

const initialImageLoad = (loader: PIXI.Loader, resource: any) => {
  console.log(resource.name);
  const url = resource.name;
  const texture = loader.resources[url].texture;
  wrapInFade(makeRibbon(texture));
};

function displayOneObject() {
  const nextObject = objects.pop();

  const { filename } = nextObject;

  const url = `http://localhost:5000/objects/${filename}`;
  console.log('loading: ', url);

  loader.add(url);
  loader.load();
}

loader.onLoad.add(initialImageLoad);

updateObjects()
  .then(displayOneObject)
  .then(() => {
    setInterval(() => {
      displayOneObject();
    }, 1000);
  });

app.ticker.add(() => {
  app.renderer.render(container, renderTexture);
});

// const kaleidoscope = new Kaleidoscope({ app, texture: renderTexture });
// kaleidoscope.draw();
