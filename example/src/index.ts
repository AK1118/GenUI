

const canvas = document.createElement("canvas");
const dev = window.devicePixelRatio;
const width = 300;
const height = 300;
canvas.width = width * dev;
canvas.height = height * dev;
canvas.style.width = width + "px";
canvas.style.height = height + "px";
canvas.style.border = "1px solid #ccc";
document.body.appendChild(canvas);
console.log("www1")
const ctx = canvas.getContext("2d");

import runApp, { Align, Colors, Container, GenPlatformConfig, GestureDetector, MainAxisAlignment, NativeEventsBindingHandler, Row, Text, Wrap } from "gen-ui";
import { DefaultNativeStrategies } from "gen-ui";

GenPlatformConfig.InitInstance({
    screenWidth: canvas.width,
    screenHeight: canvas.height,
    devicePixelRatio: dev,
    strategies: new DefaultNativeStrategies(),
    canvas,
    debug: false,
    renderContext: ctx as CanvasRenderingContext2D,
    showBanner: true
});



runApp(new GestureDetector({
    onTap: () => {
        console.log("点击")
    },
    child: new Container({
        width: canvas.width,
        height: canvas.height,
        color: Colors.gray.withAlpha(100),
    })
}))

