/*
TODO
- stream in new images
- make the image column fit the slice a little better
- kill sprites when they are entirely offscreen
*/

import './styles/style.scss';
import * as PIXI from 'pixi.js';
import { files } from './files';
import { Kaleidoscope } from './Kaleidoscope';
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

setInterval(() => {
  const initialImageLoad = () => {
    const texture = loader.resources[newImage].texture;
    const sprite = new PIXI.Sprite(texture);

    sprite.x = Math.random() * renderTexture.width;
    sprite.y = Math.random() * renderTexture.height;
    sprite.x = 0;
    // sprite.y = 0;
    container.addChild(sprite);

    const alphaSpeed = 200 + 2000 * Math.random();
    const moveSpeed = Math.random() * 0.0001;
    let count = Math.random() > 0.5 ? alphaSpeed : 0;
    app.ticker.add(() => {
      count += 1;
      // sprite.alpha = Math.sin(count / alphaSpeed);
      sprite.x += count * moveSpeed;
    });
  };

  const newImage = 'objects/' + _.sample(files);
  if (PIXI.utils.TextureCache[newImage]) {
    console.log('not reloading');
    initialImageLoad();
  } else {
    loader.add(newImage);
    loader.onComplete.add(initialImageLoad);
    loader.load();
  }
}, 250);

// const loader = new PIXI.Loader();
// for (let i = 0; i < files.length; i++) {
//   loader.add('objects/' + files[i]);
// }
// loader.onComplete.add(handleLoadComplete);
// loader.load();

// function handleLoadComplete() {
//   for (let i = 0; i < files.length; i++) {
//     const texture = loader.resources['objects/' + files[i]].texture;

//     const sprite = new PIXI.Sprite(texture);

//     sprite.x = Math.random() * renderTexture.width;
//     sprite.y = Math.random() * renderTexture.height;
//     container.addChild(sprite);

//     const alphaSpeed = 200 + 2000 * Math.random();
//     const moveSpeed = Math.random() * 0.001;
//     let count = Math.random() > 0.5 ? alphaSpeed : 0;
//     app.ticker.add(() => {
//       count += 1;
//       sprite.alpha = Math.sin(count / alphaSpeed);
//       sprite.x += count * moveSpeed;
//     });
//   }

app.ticker.add(() => {
  app.renderer.render(container, renderTexture);
});

const kaleidoscope = new Kaleidoscope({ app, texture: renderTexture });
kaleidoscope.draw();
// }
