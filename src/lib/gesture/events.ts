import { Offset } from "../basic/rect";
import Vector from "../math/vector";

export enum PointerChange {
    cancel,
    add,
    remove,
    hover,
    down,
    move,
    up,
    panZoomStart,
    panZoomUpdate,
    panZoomEnd,
  }
  export class GenPointerData {
    public change: PointerChange;
    public event: GenEvent;
    public delta: Offset;
    public position: Vector;
    constructor(
      change: PointerChange,
      event: GenEvent,
      delta: Offset,
      position: Vector
    ) {
      this.change = change;
      this.event = event;
      this.delta = delta;
      this.position = position;
    }
  }
  /**
   * 事件类型
   */
  export type GenEvent = MouseEvent | TouchEvent | Touch | WheelEvent;
  export type PointerChangeCallback = (data: GenPointerData) => void;
  export class PointerEventHandler {
    private isPointerDown = false;
    private isPanZoom = false;
    private onPointerChange: PointerChangeCallback;
    private prePointerData: GenPointerData = null;
  
    constructor(onPointerChange: PointerChangeCallback) {
      this.initializeEventListeners();
      this.onPointerChange = onPointerChange;
    }
  
    private initializeEventListeners() {
      window.addEventListener("mousedown", this.handlePointerDown.bind(this));
      window.addEventListener("mouseup", this.handlePointerUp.bind(this));
      window.addEventListener("mousemove", this.handlePointerMove.bind(this));
      window.addEventListener("mouseout", this.handlePointerCancel.bind(this));
      window.addEventListener("wheel", this.handleWheel.bind(this));
  
      // Touch events for mobile devices
      window.addEventListener("touchstart", this.handleTouchStart.bind(this));
      window.addEventListener("touchmove", this.handleTouchMove.bind(this));
      window.addEventListener("touchend", this.handleTouchEnd.bind(this));
      window.addEventListener("touchcancel", this.handleTouchCancel.bind(this));
    }
  
    private handlePointerDown(event: MouseEvent) {
      this.isPointerDown = true;
      this.isPanZoom = event.shiftKey || event.ctrlKey; // Example condition for pan/zoom
      this.handlePointerEvent(PointerChange.down, event);
    }
  
    private handlePointerUp(event: MouseEvent) {
      this.isPointerDown = false;
      this.handlePointerEvent(PointerChange.up, event);
  
      if (this.isPanZoom) {
        this.handlePointerEvent(PointerChange.panZoomEnd, event);
        this.isPanZoom = false;
      }
    }
  
    private handlePointerMove(event: MouseEvent) {
      if (this.isPointerDown) {
        this.handlePointerEvent(PointerChange.move, event);
  
        if (this.isPanZoom) {
          this.handlePointerEvent(PointerChange.panZoomUpdate, event);
        }
      } else {
        this.handlePointerEvent(PointerChange.hover, event);
      }
    }
  
    private handlePointerCancel(event: MouseEvent) {
      this.isPointerDown = false;
      this.handlePointerEvent(PointerChange.cancel, event);
    }
  
    private handleWheel(event: WheelEvent) {
      if (this.isPointerDown) {
        this.handlePointerEvent(PointerChange.panZoomUpdate, event);
      } else {
        this.handlePointerEvent(PointerChange.hover, event);
      }
    }
  
    private handleTouchStart(event: TouchEvent) {
      this.isPointerDown = true;
      this.isPanZoom = event.touches.length > 1; // Pan/zoom if more than one finger
      Array.from(event.changedTouches).forEach((touch) => {
        this.handlePointerEvent(PointerChange.down, touch);
      });
    }
  
    private handleTouchMove(event: TouchEvent) {
      Array.from(event.changedTouches).forEach((touch) => {
        if (this.isPointerDown) {
          this.handlePointerEvent(PointerChange.move, touch);
          if (this.isPanZoom) {
            this.handlePointerEvent(PointerChange.panZoomUpdate, touch);
          }
        } else {
          this.handlePointerEvent(PointerChange.hover, touch);
        }
      });
    }
  
    private handleTouchEnd(event: TouchEvent) {
      this.isPointerDown = false;
      Array.from(event.changedTouches).forEach((touch) => {
        this.handlePointerEvent(PointerChange.up, touch);
        if (this.isPanZoom) {
          this.handlePointerEvent(PointerChange.panZoomEnd, touch);
          this.isPanZoom = false;
        }
      });
    }
  
    private handleTouchCancel(event: TouchEvent) {
      this.isPointerDown = false;
      Array.from(event.changedTouches).forEach((touch) => {
        this.handlePointerEvent(PointerChange.cancel, touch);
      });
    }
  
    private handlePointerEvent(change: PointerChange, event: MouseEvent | Touch) {
      const position = this.getEventPosition(event);
      const delta = this.prePointerData
        ? Vector.sub(position, this.prePointerData.position)
        : Vector.zero;
      const pointerData = new GenPointerData(
        change,
        event,
        new Offset(delta.x, delta.y),
        position
      );
      this.onPointerChange(pointerData);
      this.prePointerData = pointerData;
      // Here you can add more logic to handle each specific pointer event
    }
  
    private getEventPosition(event: MouseEvent | Touch): Vector {
      return new Vector(
        event?.clientX ?? event?.pageX,
        event?.clientY ?? event?.pageY
      );
    }
  }
  
  export abstract class PointerEvent {
    public position: Vector;
    public delta: Offset;
    public pointer: number =1;
    constructor(position: Vector, delta: Offset) {
      this.position = position;
      this.delta = delta;
    }
  }
  
  export class DownPointerEvent extends PointerEvent {}
  export class UpPointerEvent extends PointerEvent {}
  export class MovePointerEvent extends PointerEvent {}
  export abstract class PointerEventConverter {
    private static dpr=window.devicePixelRatio;
    static expand(data: GenPointerData): PointerEvent {
      const position = new Vector(data.position.x*this.dpr, data.position.y*this.dpr);//data.position;//
      const delta =new Offset(data.delta.offsetX*this.dpr, data.delta.offsetY*this.dpr);
      switch (data.change) {
        case PointerChange.cancel:
          break;
        case PointerChange.add:
          break;
        case PointerChange.remove:
          break;
        case PointerChange.hover:
          break;
        case PointerChange.down:
          return new DownPointerEvent(position, delta);
        case PointerChange.move:
          return new MovePointerEvent(position, delta);
        case PointerChange.up:
          return new UpPointerEvent(position, delta);
        case PointerChange.panZoomStart:
          break;
        case PointerChange.panZoomUpdate:
          break;
        case PointerChange.panZoomEnd:
           break;
      }
      return null;
    }
  }