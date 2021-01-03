import '../styles/style.scss';
import * as PIXI from 'pixi.js';
import * as _ from 'lodash';
import { makeApp, ease } from '../util/pixijs-utils';
import { OneAtATimeLoader } from '../util/OneAtATimeLoader';
import { ObjectFragment } from '../util/objectFetcher';

var bigInt = require('big-integer');

function getShortcodeFromTag(tag: string) {
  let id = bigInt(tag.split('_', 1)[0]);
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let remainder;
  let shortcode = '';

  while (id.greater(0)) {
    let division = id.divmod(64);
    id = division.quotient;
    shortcode = `${alphabet.charAt(division.remainder)}${shortcode}`;
  }

  return shortcode;
}

function popIn(texture: PIXI.Texture, object: ObjectFragment) {
  const s = new PIXI.Sprite(texture);
  s.anchor.set(0.5);
  s.x = _.random(0, app.renderer.width);
  s.y = _.random(0, app.renderer.height);
  s.alpha = 0.0;

  const easeInstance = ease.add(
    s,
    {
      alpha: 1.0,
    },
    { reverse: false, duration: 2000 + _.random(10000), ease: 'easeInOutQuad' }
  );

  s.interactive = true;

  // create hit area, needed for interactivity
  // s.hitArea = new PIXI.Circle(150, 150, 100);

  let text: PIXI.Text;
  s.addListener('mouseover', () => {
    s.tint = 0xff0000;

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

  app.stage.addChild(s);
}

const app = makeApp();
const container = new PIXI.Container();
app.stage.addChild(container);

new OneAtATimeLoader({ app, refreshRate: 5000, cb: popIn }).start();
