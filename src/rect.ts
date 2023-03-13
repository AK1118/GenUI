import {  ObserverObj } from "./abstract/operation-observer";
import RecorderInterface from "./interfaces/recorder";
import Recorder from "./recorder";
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
    toVector() {
        return new Vector(this.width, this.height);
    }
}


class Rect extends ObserverObj{
    public onDrag: onDragFunction;
    public beforeDrag: onDragFunction;
    private _angle: number = 0;
    private _vertex: Vertex;
    private _position: Vector;
    private _size: Size;
    private _scale:number;
    public key: string = Math.random().toString(16).substring(2);
    constructor(params?: rectparams,key?:string,options?:{
        angle:number
    }) {
        super();
        const { width, height, x, y} = params || {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
        this._size = new Size(width, height);
        this._position = new Vector(x || 0, y || 0);
        if(key){
            this.key=key;
        }
        if(options){
            const {angle}=options;
            this.setAngle(angle);
        }
    }
    public updateVertex(): void {
        const half_w = this._size.width * .5,
            half_h = this._size.height * .5;
        this._vertex = new Vertex([
            [-half_w, - half_h],
            [+half_w, - half_h],
            [+half_w, + half_h],
            [-half_w, + half_h],
        ]);
        this._vertex.rotate(this.getAngle, this);
    }
    public get position(): Vector {

        return this._position;
    }
    public get size(): Size {
        return this._size;
    }
    public get scale(): number {
        return this._scale;
    }
    public get vertex(): Vertex {
        return this._vertex;
    }
    public get getAngle(): number {
        return this._angle;
    }
    public set position(position: Vector) {
        this._position = position;
        this.report(position,"position");
    }
    public setScale(scale: number): void {
        this._size.width *= scale;
        this._size.height *= scale;
        this.report(scale,"scale");
    }
    public setSize(width: number, height: number): void {
        this._size.width = width;
        this._size.height = height;
        this.report(this._size,"size");
    }
    public setAngle(angle: number): void {
        this._angle = angle;
        this.report(angle,"angle");
    }
    /**
     * @description 向观察者汇报自己的变化情况
     * @param value 
     * @param type 
     * @returns 
     */
    private report(value: any, type: "size" | "angle" | "scale" | "position"): void {
        if (this.observer == null) return;
        this.observer.report(value,type);
        // switch (type) {
        //     case "size":
        //         this.observer.didChangeSize(value);
        //         break;
        //     case "angle":
        //         this.observer.didChangeAngle(value);
        //         break;

        //     case "scale":
        //         this.observer.didChangeScale(value);
        //         break;

        //     case "position":
        //         this.observer.didChangePosition(value);
        //         break;

        //     default:
        //         break;
        // }
    }
    public copy(key?:string) {
        return new Rect({
            width: this._size.width,
            height: this._size.height,
            x: this._position.x,
            y: this._position.y,
        },key,{
            angle:this.getAngle
        });
    }
    public set(newRect:Rect){
        this.position.set(newRect.position);
        this.setAngle(newRect.getAngle);
        this.setScale(newRect.scale);
        this.setSize(newRect.size.width,newRect.size.height)
    }
}



export default Rect;
export {
    onDragFunction,
}