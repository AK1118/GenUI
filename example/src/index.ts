

const canvas = document.createElement("canvas");
const dev = window.devicePixelRatio;
canvas.width = 300 * dev;
canvas.height = 300 * dev;
// canvas.style.width = canvas.width + "px";
// canvas.style.height = canvas.height + "px";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

import runApp, { Align, Colors, Container, GenPlatformConfig, GestureDetector, MainAxisAlignment, NativeEventsBindingHandler, Row, Text } from "gen-ui";
import { DefaultNativeStrategies } from "gen-ui";

GenPlatformConfig.InitInstance({
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 0,
    strategies: new DefaultNativeStrategies(),
    canvas,
    debug: false,
    renderContext: ctx as CanvasRenderingContext2D,
});



const eventCaller = new NativeEventsBindingHandler();
window.onmousedown=(e)=>eventCaller.applyEvent("mousedown",e)

runApp(new Container({
    width: canvas.width,
    height: canvas.height,
    color: Colors.gray.withAlpha(100),
    child: new Align({
        child: new GestureDetector({
            onTap:()=>{
                console.log("tap")
            },
            child:new Row({
                mainAxisAlignment:MainAxisAlignment.center,
                spacing:10,
                children:[
                    new Container({
                        color:Colors.white,
                        width:100,
                        height:100,
                        child: new Text("你好"),
                    }),new Container({
                        color:Colors.white,
                        width:100,
                        height:100,
                        child: new Text("你好"),
                    })
                ]
            })
        })
    })
}))

