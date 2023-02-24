import Rect from "./rect";
import Vector from "./vector";

class Drag {
    private rect: Rect = null;
    private offset: Offset;
    public catchImageBox(rect: Rect, position: Vector|any): void {
        this.rect = rect;
        this.offset = {
            offsetx: this.rect.position.x - position.x,
            offsety: this.rect.position.y - position.y,
        }
    }
    /**
     * @description 手指抬起调用
     */
    up(){
        
    }
    public cancel(): void {
        this.rect = null;
    }
    public update(position: Vector|any): void {
        if (this.rect == null) return;
        if(this.rect.beforeDrag!=null)this.rect.beforeDrag(this.rect);
        this.rect.position.setXY(
            ~~(position.x + this.offset.offsetx),
            ~~(position.y + this.offset.offsety)
        );
        if(this.rect.onDrag!=null)this.rect.onDrag(this.rect);
    }
}

export default Drag;