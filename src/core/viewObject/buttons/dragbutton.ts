import { FuncButtonTrigger } from "../../enums";
import Alignment from "@/core/lib/painting/alignment";
import BaseButton, { ButtonOption } from "../../abstract/baseButton";
import Painter from "../../lib/painter";
import Rect from "../../lib/rect";
import Vector from "../../lib/vector";
import Widgets from "../../../static/widgets";
import ViewObject from "../../abstract/view-object";
import { Delta } from "../../../utils/event/event";
import { Icon } from "@/core/lib/icon";
import DragIcon from "@/static/icons/dragIcon";
import { ExportButton } from "Serialization";

interface DragButtonInterface extends ButtonOption {
  angleDisabled: boolean;
}

export type DragButtonOption = Partial<DragButtonInterface>;

class DragButton extends BaseButton {
  readonly name: ButtonNames = "DragButton";
  protected buttonAlignment: Alignment = Alignment.bottomRight;
  protected icon: Icon = new DragIcon();
  public trigger: FuncButtonTrigger = FuncButtonTrigger.drag;
  private preViewObjectRect: Rect = null;
  public oldAngle: number = 0;
  private disable: boolean = false;
  private delta: Delta;
  public radius: number = 10;
  protected preMag: number = -1;
  private angleDisabled: boolean = false;
  key: string | number = +new Date();
  constructor(options?: DragButtonOption) {
    super(options);
    this.rect.onDrag = (currentButtonRect: Rect) => {
      /*拖拽缩放*/
      this.rect = currentButtonRect;
      this.effect(currentButtonRect);
    };
    if (options) {
      this.angleDisabled = options.angleDisabled;
    }
  }
  updatePosition(vector: Vector): void {
    this.updateRelativePosition();
    this.setAbsolutePosition(vector);
  }
  setMaster(master: ViewObject): void {
    this.master = master;
  }
  /**
   * 为拖拽改变大小初始化
   */
  private initScale() {
    // this.computeRelativePositionByLocation();
    this.preMag = -1;
  }
  effect(currentButtonRect?: Rect): void {
    const mag = this.getButtonWidthMasterMag(currentButtonRect);
    if (this.preMag === -1) this.preMag = mag;
    const deltaScale: number = mag / this.preMag;
    const [offsetX, offsetY] = currentButtonRect.position
      .sub(this.master.position)
      .toArray();
    this.master.setDeltaScale(deltaScale);
    if (!this.angleDisabled) {
      const angle = Math.atan2(offsetY, offsetX) - this.oldAngle;
      this.master.rect.setAngle(angle);
    }
    this.preMag = mag;
  }
  public async export<O = any>(): Promise<ExportButton<O>> {
    const entity = await super.export();
    return Promise.resolve(entity as any);
  }

  protected getButtonWidthMasterMag(currentButtonRect: Rect): number {
    const currentButtonPosition: Vector = currentButtonRect.position;
    const currentMasterPosition: Vector = this.master.rect.position;
    const mag: number = Vector.mag(
      Vector.sub(currentButtonPosition, currentMasterPosition)
    );
    return mag;
  }
  public get getOldAngle(): number {
    return this.oldAngle;
  }
  public render(paint: Painter): void {
    if (!this.delta) this.delta = new Delta(this.position.x, this.position.y);
    this.delta.update(this.position.copy());
    this.draw(paint);
  }
  onSelected(): void {
    this.preViewObjectRect = this.master.rect.copy();
    this.initScale();
  }
  hide() {
    this.disable = true;
  }
  show() {
    this.disable = false;
  }
}

export default DragButton;
