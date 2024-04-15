import BaseButton, { ButtonOption } from "@/core/abstract/baseButton";
import ViewObject from "@/core/abstract/view-object";
import { FuncButtonTrigger } from "@/core/enums";
import RenderObject from "@/core/interfaces/render-object";
import Painter from "@/core/lib/painter";
import Alignment from "@/core/lib/painting/alignment";
import Rect from "@/core/lib/rect";
import Vector from "@/core/lib/vector";

import { ExportButton } from "@/types/serialization";
import { ViewObjectExportEntity } from "@/types/serialization";
import TextBox from "../text/text";
import ImageBox from "../image";
import Rectangle from "../graphics/rectangle";

export interface EventButtonOption extends ButtonOption {
  onClick: VoidFunction;
  child: TextBox | ImageBox | Rectangle;
}

class EventButton extends BaseButton {
  protected buttonAlignment: Alignment = Alignment.topRight;
  readonly name: ButtonNames = "EventButton";
  trigger: FuncButtonTrigger = FuncButtonTrigger.click;
  private child: EventButtonOption["child"];
  public onClick: VoidFunction;
  constructor(eventButtonOption?: Partial<EventButtonOption>) {
    const { onClick, child } = eventButtonOption ?? {};
    super(eventButtonOption);
    this.onClick = onClick ?? (() => {});
    this.child = child;
  }
  setMaster(master: RenderObject): void {}
  effect(currentButtonRect?: Rect): void {
    this.onClick?.();
  }
  protected afterMounted(...args: any[]): void {
    if (this.child) this.child!.initialization(this.master.getKit());
  }
  updatePosition(vector: Vector): void {
    super.updateRelativePosition();
  }
  public async export<OO>(): Promise<ExportButton<OO>> {
    const entity = await super.export<OO>();
    if (this.child) {
      const childEntity = (await this.child.export()) as ViewObjectExportEntity;
      entity.option = {
        child: childEntity,
      } as OO;
    }
    return Promise.resolve(entity);
  }
  protected drawButton(
    position: Vector,
    size: Size,
    radius: number,
    paint: Painter
  ): void {
    if (!this.child?.mounted) {
      super.drawButton(position, size, radius, paint);
      return;
    }
    paint.save();
    paint.translate(position.x, position.y);
    this.child.render(paint);
    paint.restore();
  }
}

export default EventButton;

// class CustomButton extends BaseButton {
//   readonly name: ButtonNames = "CustomButton";
//   protected buttonAlignment: Alignment = Alignment.topRight;
//   public onClick: VoidFunction;
//   trigger: FuncButtonTrigger = FuncButtonTrigger.click;
//   private child: ViewObject;
//   constructor(option?: {
//     child?: ViewObject;
//     onClick?: VoidFunction;
//     option?: ButtonOption;
//   }) {
//     super(option?.option);
//     this.child = option?.child;
//     this.child?.unUseCache();
//     this.onClick = option?.onClick;
//   }
//   setMaster(master: ViewObject): void {
//     this.master = master;
//   }
//   protected afterMounted(...args: any[]): void {
//     this.child?.initialization(this.master.getKit());
//   }
//   effect(): void {
//     this.onClick?.();
//   }
//   public async export<OO>(): Promise<ExportButton<OO>> {
//     const entity = await super.export<OO>();
//     if (this.child) {
//       const childEntity = (await this.child.export()) as ViewObjectExportEntity;
//       entity.option = {
//         child: childEntity,
//       } as OO;
//     }
//     return Promise.resolve(entity);
//   }
//   updatePosition(vector: Vector): void {
//     this.updateRelativePosition();
//     this.setAbsolutePosition(vector);
//   }
//   protected drawButton(
//     position: Vector,
//     size: Size,
//     radius: number,
//     paint: Painter
//   ): void {
//     if (!this.child?.mounted) return;
//     paint.save();
//     paint.translate(position.x, position.y);
//     this.child.render(paint);
//     paint.restore();
//   }
//   onSelected(): void {
//     throw new Error("Method not implemented.");
//   }
// }

// export default CustomButton;
