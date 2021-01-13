const { record } = require("puppeteer-recorder");

let framesRendered = 0;
const fps = 60;
const time = 5;
const frames = fps * time;

record({
  browser: null, // Optional: a puppeteer Browser instance,
  page: null, // Optional: a puppeteer Page instance,
  output: "output.webm",
  fps,
  frames, // 5 seconds at 60 fps
  prepare: function (browser, page) {
    /* executed before first capture */
    console.log('prepare');
    return page.goto("http://localhost:8080/mandala1.html");
  },
  render: function (browser, page, frame) {
    framesRendered += 1;
    if (framesRendered % 10 === 0) {
      console.log(`frame ${framesRendered}/${frames} - ${(framesRendered*100/frames).toFixed(2)}%`)
    }
  },
});
