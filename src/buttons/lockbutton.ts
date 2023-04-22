import { FuncButtonTrigger } from "../enums";
 
import Button from "../abstract/button";
import Painter from "../painter";
import Rect from "../rect";
import Vector from "../vector";
import Widgets from "../widgets";
import ViewObject from "../abstract/view-object";



class LockButton extends Button {
    trigger: FuncButtonTrigger = FuncButtonTrigger.click;
    radius: number = 10;
    key: string | number;
    //世界坐标
    rect: Rect;
    //相对坐标
    relativeRect: Rect;
    master: ViewObject;
    constructor(master: ViewObject) {
        super(master);
        this.init({percentage:[-.5, -.5]});
    }

    updatePosition(vector: Vector): void {
        this.updateRelativePosition();
        this.setAbsolutePosition(vector);
    }
    setMaster(master: ViewObject): void {
        this.master = master;
    }
    effect(): void {
        this.master.lock();
    }
    draw(paint: Painter): void {
        const {
            width,
            height
        } = this.master.rect.size;
        const halfRadius = this.radius * .75;

        const x = this.relativeRect.position.x, y = this.relativeRect.position.y;
        paint.beginPath();
        paint.fillStyle = "#fff";
        paint.arc(x, y, this.radius, 0, Math.PI * 2);
        paint.closePath();
        paint.fill();
        Widgets.drawLock(paint, {
            offsetx: x - halfRadius + 1,
            offsety: -height / 2 - halfRadius + 3
        });
    }
    update(paint: Painter): void {
        this.draw(paint);
    }
    onSelected(): void {

    }

}

export default LockButton;