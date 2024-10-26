//反向裁剪举例

// img2.onload = () => {
//   // const path = new Path2D();
//   // path.rect(0, 0, 100, 100);
//   // path.arc(50, 50, 25, 0, Math.PI * 2, true);

//   // g.save();
//   // g.shadowColor = "#000";
//   // g.shadowBlur = 3;
//   // g.shadowOffsetX = 3;
//   // g.shadowOffsetY = 3;
//   // g.fillStyle = "white";
//   // g.fill(path);
//   // g.restore();

//   // g.save();
//   // g.clip(path);
//   // g.drawImage(img2, 0, 0, 100, 100);
//   // g.restore();
//   // 绘制矩形和圆形路径
//   g.save();
//   g.beginPath();
//   g.rect(0, 0, 100, 100);
//   g.arc(50, 50, 25, 0, Math.PI * 2,true);

//   // 应用阴影并填充路径
//   g.shadowColor = "#ccc";
//   g.shadowBlur = 3;
//   g.shadowOffsetX = 3;
//   g.shadowOffsetY = 3;
//   g.fillStyle = "white";
//   g.fill();
//   g.restore();

//   // 使用路径剪裁并绘制图像
//   g.save();
//   g.beginPath();
//   g.rect(0, 0, 100, 100);
//   g.arc(50, 50, 25, 0, Math.PI * 2, true);
//   g.clip();
//   g.drawImage(img2, 0, 0, 100, 100);
//   g.restore();
// };
