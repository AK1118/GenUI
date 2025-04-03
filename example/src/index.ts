const canvas=document.createElement("canvas");
const dev=window.devicePixelRatio;
canvas.width=300*dev;
canvas.height=300*dev;
document.body.appendChild(canvas);

const ctx=canvas.getContext("2d");

