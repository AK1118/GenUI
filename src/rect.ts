import Vector from "./vector";
import Vertex from "./vertex";

/**
 * @typedef 拖拽的回调函数
 */
declare interface onDragFunction {
    (rect: Rect): void;
}

class Size {
    width: number;
    height: number;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
    toVector(){
        return new Vector(this.width,this.height);
    }
}


class Rect {
    public onDrag: onDragFunction;
    public beforeDrag:onDragFunction;
    public angle: number=0;
    public vertex: Vertex;
    public position: Vector;
    public size: Size;
    constructor(params?: rectparams) {
        const { width, height, x, y } = params||{
            x:0,
            y:0,
            width:0,
            height:0,
        };
        this.size = new Size(width, height);
        this.position = new Vector(x || 0, y || 0);
    }
    public updateVertex(): void {
        const half_w = this.size.width * .5,
            half_h = this.size.height * .5;
        this.vertex = new Vertex([
            [-half_w, - half_h],
            [+half_w, - half_h],
            [+half_w, + half_h],
            [-half_w, + half_h],
        ]);
        this.vertex.rotate(this.getAngle,this);
    }
    setPotision(x: number, y: number): void {
        this.position.x=x;
        this.position.y=y;
    }
    setScale(scale: number): void {
        this.size.width *= scale;
        this.size.height *= scale;
    }
    setSize(width: number, height: number): void {
        this.size.width = width;
        this.size.height = height;
    }
    setAngle(angle: number): void {
        /**
         * 在设置角度同时，以45度为矫正参考，吸附
         */
        // let _angle=+angle.toFixed(2);
        // this.angle = _angle;
        // const _45=0.78;
        // const limit=0.1;
        // const scale=(this.angle/0.78)>>0;
        // this.angle=Math.abs(_angle-scale*_45)<limit?scale*_45:_angle;
        this.angle=angle;
    }
    get getAngle(): number {
        return this.angle;
    }
    copy() {
        return new Rect({
            width: this.size.width,
            height: this.size.height,
            x: this.position.x,
            y: this.position.y
        });
    }
}



export default Rect;
export {
    onDragFunction,
}