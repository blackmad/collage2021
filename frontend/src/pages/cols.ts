import '../styles/style.scss';
import * as PIXI from 'pixi.js';
import * as _ from 'lodash';
import { ease } from 'pixi-ease';
import { ObjectFetcher } from '../util/objectFetcher';

const objectFetcher = new ObjectFetcher({ label: 'book' });

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
  const startX =
    Math.random() * (app.renderer.width + texture.width) - texture.width / 2;
  const tileHeight =
    Math.floor(app.renderer.height / texture.height) * texture.height * 4;
  // (4 + Math.random() * 10);
  const tiledSprite = new PIXI.TilingSprite(texture, texture.width, tileHeight);
  tiledSprite.x = startX;
  tiledSprite.y = -tileHeight;
  app.stage.addChild(tiledSprite);

  const duration = 7000 + 10000 * Math.random();
  const easeInstance = ease.add(
    tiledSprite,
    {
      y: tileHeight,
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
  const container = makeRibbon(texture);
};

async function displayOneObject() {
  const url = await objectFetcher.getObject();
  console.log('loading: ', url);

  loader.add(url);
  loader.load();
}

loader.onLoad.add(initialImageLoad);

// displayOneObject();
objectFetcher.addToQueue().then(() => {
  displayOneObject();
  setInterval(() => {
    displayOneObject();
  }, 750);
});

app.ticker.add(() => {
  app.renderer.render(container, renderTexture);
});

// const kaleidoscope = new Kaleidoscope({ app, texture: renderTexture });
// kaleidoscope.draw();
