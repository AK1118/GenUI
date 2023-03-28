import { FuncButtonTrigger } from "../enums";
 
import Button from "../abstract/button";
import Painter from "../painter";
import Rect from "../rect";
import Vector from "../vector";
import Widgets from "../widgets";
import ViewObject from "../abstract/view-object";



class DelockButton extends Button {
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
        this.init({
            percentage:[.5, .5],
        });
        this.free = true;
        this.disabled=true;
    }
    updatePosition(vector: Vector): void {
        this.updateRelativePosition();
        this.setAbsolutePosition(vector);
    }
    setMaster(master: ViewObject): void {
        this.master = master;
    }
    effect(): void {
        this.master.deblock();
    }
    draw(paint: Painter): void {
        const {
            width,
            height
        } = this.master.rect.size;
        const halfRadius = this.radius * .75;
        const halfWidth = width >> 1,
            halfHeight = height >> 1;
        paint.beginPath();
        paint.fillStyle = "#fff";
        paint.arc(halfWidth,halfHeight, this.radius, 0, Math.PI * 2);
        paint.closePath();
        paint.fill();
        Widgets.drawDeLock(paint, {
            offsetx: halfWidth - halfRadius + 2,
            offsety: halfHeight - halfRadius + 2
        });
    }
    update(paint: Painter): void {
        this.draw(paint);
    }
    onSelected(): void {

    }

}

export default DelockButton;