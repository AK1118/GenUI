import ViewObject from "../../core/abstract/view-object";
import CheckInside from "./checkInside";
import Rect from "../../core/lib/rect";
import Vector from "../../core/lib/vector";
import { Point } from "../../core/lib/vertex";

class CatchPointUtil{
    static _checkInside:CheckInside=new CheckInside;
    /**
     * 
     * @param ViewObject 
     * @param event 
     * @returns 
     */
    static catchViewObject(ViewObjectList:ViewObject[],position:any):ViewObject{
        const len:number=ViewObjectList.length-1;
        for(let i=len;i>=0;i--){
            const item:ViewObject=ViewObjectList[i];
            //隐藏过后不需要检测位置
            //是背景元素也不需要检测位置
            if(item.disabled||item.isBackground)continue;
            if(CatchPointUtil.inArea(item.rect,position)){
                return item;
            }
        }
        return null;
    }
    static inArea(rect:Rect,position:Vector):boolean{
        if(!rect.vertex)return false;
        const points:Point[]=rect.vertex?.getPoints();
        const point:Point=new Point(
            position.x,
            position.y
        );
        return !!CatchPointUtil._checkInside.checkInside(points,4,point);
    }
    /**
	 * @param {Vector} p1
	 * @param {Vector} p2
	 * @param {Object} radius
	 */
	static checkInsideArc(p1:Vector, p2:Vector, radius:number) :boolean{
		return Vector.dist(p1, p2) < radius;
	}
}

export default CatchPointUtil;