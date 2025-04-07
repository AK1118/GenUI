

const canvas = document.createElement("canvas");
const dev = window.devicePixelRatio;
const width= 300;
const height= 300;
canvas.width = width * dev;
canvas.height = height * dev;
canvas.style.width = width + "px";
canvas.style.height = height + "px";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

import runApp, { Align, Colors, Container, GenPlatformConfig, GestureDetector, MainAxisAlignment, NativeEventsBindingHandler, Row, Text } from "gen-ui";
import { DefaultNativeStrategies } from "gen-ui";

GenPlatformConfig.InitInstance({
    screenWidth: canvas.width,
    screenHeight: canvas.height,
    devicePixelRatio: dev,
    strategies: new DefaultNativeStrategies(),
    canvas,
    debug: false,
    renderContext: ctx as CanvasRenderingContext2D,
});



const eventCaller = new NativeEventsBindingHandler();
if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    // Touch events for mobile devices
    window.addEventListener("touchstart", (e) => {
        eventCaller.applyEvent("touchstart", e);
    });
    window.addEventListener("touchmove", (e) => {
        eventCaller.applyEvent("touchmove", e);
    });
    window.addEventListener("touchend", (e) => {
        eventCaller.applyEvent("touchend", e);
    });
    window.addEventListener("touchcancel", (e) => {
        eventCaller.applyEvent("touchcancel", e);
    });
} else {
    window.addEventListener("mousedown", (e) => {
        eventCaller.applyEvent("mousedown", e);
    });
    window.addEventListener("mousemove", (e) => {
        eventCaller.applyEvent("mousemove", e);
    });
    window.addEventListener("mouseup", (e) => {
        eventCaller.applyEvent("mouseup", e);
    });
    window.addEventListener("mousedown", (e) => {
        eventCaller.applyEvent("mousedown", e);
    });
    window.addEventListener("wheel", (e) => {
        eventCaller.applyEvent("wheel", e);
    });
}


runApp(new GestureDetector({
    onTap: () => {
        console.log("点击")
    },
    child: new Container({
        width: canvas.width,
        height: canvas.height,
        color: Colors.gray.withAlpha(100),
        child: new Container({
            color: Colors.white,
            width: 100,
            height: 100,
            // child: new Text("你好"),
        }),
    })
}))

