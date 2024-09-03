import { Offset } from "../basic/rect";

class PointAtTime {
  public time: number;
  public position: Offset;
  constructor(time: number, position: Offset) {
    this.time = time;
    this.position = position;
  }
  get x():number{
    return this.position.offsetX;
  }
  get y():number{
    return this.position.offsetY;
  }
}

class VelocityTracker {
  private positions: Array<PointAtTime> = new Array<PointAtTime>();
  private historySize: number = 20;
  addPosition(position: Offset) {
    const time = +new Date();
    this.positions.push(new PointAtTime(time, position));

    // 保持最大历史记录的数量
    if (this.positions.length > this.historySize) {
      this.positions.shift();
    }
  }
  getVelocity(): Offset {
    if (this.positions.length < 2) {
        return Offset.zero; // 如果位置点不足，速度为0
      }
  
      const oldest = this.positions[0];
      const latest = this.positions[this.positions.length - 1];
  
      const timeDelta = (latest.time - oldest.time) / 1000; // 时间差，单位为秒
      const xDelta = latest.x - oldest.x;
      const yDelta = latest.y - oldest.y;
  
      // 计算速度，单位为像素/秒
      const velocityX = xDelta / timeDelta;
      const velocityY = yDelta / timeDelta;
      this.reset();
      return new Offset(velocityX, velocityY);
  }
  reset(){
    this.positions=[];
  }
}

export default VelocityTracker;
