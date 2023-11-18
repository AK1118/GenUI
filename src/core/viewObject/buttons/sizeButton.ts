/**
 * 改变大小按钮
 */

import Painter from "../../lib/painter";
import Rect from "../../lib/rect";
import Widgets from "../../../static/widgets";
import DragButton from "./dragbutton";
import { ButtonLocation } from "../../enums";
import Vector from "@/core/lib/vector";
import { Icon } from "@/core/lib/icon";
import ScaleIcon from "@/static/icons/scaleIcon";
import { ButtonOption } from "@/core/abstract/baseButton";
import { DefaultIcon } from "@/composite/icons";

class SizeButton extends DragButton {
  protected buttonLocation:ButtonLocation=ButtonLocation.RB;
  protected icon: Icon=new DefaultIcon();
  constructor(location:ButtonLocation,option?:ButtonOption){
    super({
      angleDisabled:true,
      buttonOption:option,
    },);
    this.buttonLocation=location;
    this.beforeMounted(location);
  }
  /**
   * @description 在按钮挂载前设置位置
   * @param location 
   */
  protected beforeMounted(location:ButtonLocation): void {
    //按钮功能原因.按钮必须设置枚举位置,不允许设置position位置,这是强制的.
    this.setLocationByEnum(location);   
  }
  
  protected manipulateDelta(delta:Vector):void{
    switch(this.buttonLocation){
      case ButtonLocation.LT:{
        delta.y*=-1;
        delta.x*=-1;
      };break;
      case ButtonLocation.LB:{
        delta.x*=-1;
      };break;
      case ButtonLocation.RT:{
        delta.y*=-1;
      };break;
      case ButtonLocation.RB:{
       
      };break;
      case ButtonLocation.RC:{
        delta.y=0;
      };break
      case ButtonLocation.BC:{
        delta.x=0;
      };break
      case ButtonLocation.LC:{
        delta.x*=-1;
        delta.y=0;
      };break;
      case ButtonLocation.TC:{
        delta.x=0;
        delta.y*=-1;
      };break;
    }
  }
  public setLocation(location: ButtonLocation): void {
      this.buttonLocation=location;
      if(this.mounted)this.initialization(this.master);
  }
  effect(currentButtonRect?: Rect): void {
    const mag = this.getButtonWidthMasterMag(currentButtonRect);
    const preMasterSize: Size = this.master.size.copy();
    if (this.preMag === -1) {
      this.preMag = mag;
      return;
    }
    const deltaScale: number = mag / this.preMag;
    const rScale: number = deltaScale + (1 - deltaScale) / 2;
    this.master.setDeltaScale(rScale);
    const currentMasterSize: Size = this.master.size.copy();
    
    let delta = currentMasterSize
      .toVector()
      .sub(preMasterSize.toVector())
      .half();

    this.manipulateDelta(delta);
    
    //获取Widget对象的弧度制的角度
    const angleInRadians = this.master.rect.getAngle;
    
    // 假设 delta 是旧的 delta 向量
    const [x, y] = delta.toArray();
    
    /**
     * 使用矩阵旋转计算新的 delta.x 和 delta.y
     * R = | cos(angle)  -sin(angle) |
           | sin(angle)   cos(angle) |

        新速度向量 = R * 原速度向量
     */
    const newDeltaX =
      Math.cos(angleInRadians) * x - Math.sin(angleInRadians) * y;
    const newDeltaY =
      Math.sin(angleInRadians) * x + Math.cos(angleInRadians) * y;

    // 现在 newDelta 包含了根据给定角度 angle 重新计算的移动速度
    this.master.addPosition(newDeltaX,newDeltaY);
    this.preMag = deltaScale < 1 ? mag + delta.mag() : mag - delta.mag();
  }
}


export default SizeButton;