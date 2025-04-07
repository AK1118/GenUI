// import { TextInputStreamDemo } from "./demos/text-input-stream";
import "./demos/template"
// // TextInputStreamDemo();
//@ts-ignore
import eruda from "eruda";
eruda.init();
import runApp, { Colors, Container, GestureDetector } from "@/index";
import { GenPlatformConfig } from "@/lib/core/platform";
import { NativeEventsBindingHandler } from "@/lib/native/events";
import { DefaultNativeStrategies } from "@/lib/native/native-strategies";



// // function readonly(target: User, key: string,): void {
// //     console.log("注解生效", target, key);
// // }




// // class User {
// //     @readonly
// //     name: string = "测试";
// // }


// // class B {
// //     @readonly
// //     name: string = "测试2";
// // }
// // new User().name="测试2";


// // const fetchImage = async () => {
// //     const res = await fetch("https://dummyimage.com/200x300/000/fff");
// //     const blob = await res.arrayBuffer();
// //     const buffer = new Uint8Array(blob);
// //     const blob2 = new Blob([buffer], { type: "image/png" });
// //     const url = URL.createObjectURL(blob2);
// //     const img = document.createElement("img");
// //     img.src = url;
// //     document.body.appendChild(img);
// //     return url;

// // }

// // fetchImage();




// const canvas = document.createElement("canvas");
// const dev = window.devicePixelRatio;
// const width= 300;
// const height= 300;
// canvas.width = width * dev;
// canvas.height = height * dev;
// canvas.style.width = width + "px";
// canvas.style.height = height + "px";
// document.body.appendChild(canvas);

// const ctx = canvas.getContext("2d");


// GenPlatformConfig.InitInstance({
//     screenWidth: 0,
//     screenHeight: 0,
//     devicePixelRatio: 0,
//     strategies: new DefaultNativeStrategies(),
//     canvas,
//     debug: false,
//     renderContext: ctx as CanvasRenderingContext2D,
// });



// const eventCaller = new NativeEventsBindingHandler();
// if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
//     // Touch events for mobile devices
//     window.addEventListener("touchstart", (e) => {
//         eventCaller.applyEvent("touchstart", e);
//     });
//     window.addEventListener("touchmove", (e) => {
//         eventCaller.applyEvent("touchmove", e);
//     });
//     window.addEventListener("touchend", (e) => {
//         eventCaller.applyEvent("touchend", e);
//     });
//     window.addEventListener("touchcancel", (e) => {
//         eventCaller.applyEvent("touchcancel", e);
//     });
// } else {
//     window.addEventListener("mousedown", (e) => {
//         eventCaller.applyEvent("mousedown", e);
//     });
//     window.addEventListener("mousemove", (e) => {
//         eventCaller.applyEvent("mousemove", e);
//     });
//     window.addEventListener("mouseup", (e) => {
//         eventCaller.applyEvent("mouseup", e);
//     });
//     window.addEventListener("mousedown", (e) => {
//         eventCaller.applyEvent("mousedown", e);
//     });
//     window.addEventListener("wheel", (e) => {
//         eventCaller.applyEvent("wheel", e);
//     });
// }


// runApp(new GestureDetector({
//     onTap: () => {
//         console.log("点击")
//     },
//     child: new Container({
//         width: canvas.width,
//         height: canvas.height,
//         color: Colors.gray.withAlpha(100),
//         child: new Container({
//             color: Colors.white,
//             width: 100,
//             height: 100,
//             // child: new Text("你好"),
//         }),
//     })
// }))

