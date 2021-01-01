import './styles/style.scss';
import * as PIXI from 'pixi.js';

console.log('hello, world');

const testMessage = 'TypeScript works';

console.log(testMessage);

let type = 'WebGL';
if (!PIXI.utils.isWebGLSupported()) {
  type = 'canvas';
}

PIXI.utils.sayHello(type);

//Create a Pixi Application
const app = new PIXI.Application({ width: 256, height: 256 });

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
