import RenderObject from "../interfaces/render-object";
import Painter from "../lib/painter";
import Rect, { Size } from "../lib/rect";
import Vector from "../lib/vector";
import { Point } from "../lib/vertex";
import Button, { BaseButton } from "./baseButton";
import OperationObserver from "./operation-observer";
import AuxiliaryLine from "../../tools/auxiliary-lines";
import { ViewObjectFamily } from "../enums";
import ImageToolkit from "../lib/image-tool-kit/image-toolkit";
import { Delta } from "../../utils/event/event";
import BaseViewObject from "./view-object-base";
import {
  ExportButton,
  FetchXImageForImportCallback,
  ViewObjectExportBaseInfo,
  ViewObjectExportImageBox,
  ViewObjectImportBaseInfo,
  ViewObjectImportImageBox,
} from "@/types/serialization";
import Platform from "../viewObject/tools/platform";
import BoxDecoration from "../lib/rendering/decorations/box-decoration";
import { BoxDecorationOption, Decoration } from "Graphics";
import { CenterAxis } from "@/types/controller";
import DecorationBase from "../bases/decoration-base";
import { SelectedBorderStyle } from "@/types/gesti";
import ImageToolkitAdapterController from "../lib/image-tool-kit/adpater";
import CatchPointUtil from "@/utils/event/catchPointUtil";

/**
 *
 * 缓存要做到 数据层缓存，渲染层缓存
 * 如果没有缓存 =》 新建缓存  =》渲染缓存
 * 如果有缓存 =》 渲染缓存
 *
 * 缓存包括数据有   rect,渲染层图片
 *
 *
 */
abstract class ViewObject<
  D extends DecorationBase = DecorationBase
> extends BaseViewObject<D> {
  //辅助线
  private auxiliary: AuxiliaryLine;
  public originFamily: ViewObjectFamily;

  //获取对象值
  abstract get value(): any;

  public initialization(kit: ImageToolkitAdapterController): void {
    this.setKit(kit);
    //初始化一些数据，准备挂载
    this.ready(kit);
    //添加监听
    this.observeStart();
    //初始化矩阵点
    this.rect.updateVertex();
    //挂载
    this.mount();
    this.setFixedSize(this.size.toObject());
    this.initializationButtons();
  }
  //卸载按钮
  public unInstallButton(buttons: Array<Button>) {
    this.funcButton = this.funcButton.filter((item) => {
      //是否在卸载队列内
      const include: boolean = buttons.includes(item);
      if (include) item.unMount();
      return !include;
    });
  }
  //安装按钮
  public installButton(button: Button) {
    this.funcButton.push(button);
    this.initializationButtons();
  }
  //安装多个按钮
  public installMultipleButtons(buttons: Array<Button>): void {
    if (!Array.isArray(buttons))
      throw new Error("Must be a class Button Array.");
    //如果已经挂载，就初始化按钮
    this.funcButton.push(...buttons);
    this.initializationButtons();
  }
  private initializationButtons(): void {
    if (this.mounted) this.funcButton.forEach((_) => _.initialization(this));
  }
  public mirror(): boolean {
    this.isMirror = !this.isMirror;
    return this.isMirror;
  }

  public render(paint: Painter, isCache?: boolean) {
    if (!this.mounted) return;
    /*更新顶点数据*/
    if (this.didChanged) {
      this.rect.updateVertex();
      this.reBuild();
    }
    //执行缓存画布生成
    if (this.isUseRenderCache && !this.offScreenCreated) {
      this.performCache();
    }
    this.draw(paint, isCache);
  }
  protected performCache() {
    //生成画布会返回布尔值判断是否生成成功，生成失败关闭缓存功能
    const created = this.generateOffScreenCanvas();
    //创建离屏失败，关闭缓存渲染
    if (!created) this.unUseCache();
    this.draw(this.offScreenPainter, true);
    this.offScreenPainter.save();
    this.offScreenPainter.translate(this.width * 0.5, this.height * 0.5);
    this.decoration?.render(this.offScreenPainter, this.rect);
    this.drawImage(this.offScreenPainter);
    this.offScreenPainter.restore();
  }
  /**
   * @description 实时渲染或者渲染缓存
   * @param paint
   */
  private renderImageOrCache(paint: Painter) {
    if (this.canRenderCache) {
      //渲染缓存
      paint.drawImage(this.offScreenCanvas, 0, 0, this.width, this.height);
    } else {
      this.decoration?.render(paint, this.rect);
      this.drawImage(paint);
    }
  }
  public draw(paint: Painter, isCache?: boolean): void {
    //渲染缓存不需要设置或渲染其他属性
    paint.beginPath();
    paint.save();
    //缓存不需要这两个
    if (!isCache) {
      paint.translate(this.positionX, this.positionY);
      paint.rotate(this.rect.getAngle);
    }
    if (this.isMirror) paint.scale(-1, 1);
    paint.globalAlpha = this.opacity;
    this.renderImageOrCache(paint);
    //选中和不是缓存时才渲染
    this.renderSelected(paint, isCache);
    paint.restore();
    paint.closePath();
  }
  private renderSelected(paint: Painter, isCache?: boolean) {
    if (this.selected && !isCache) {
      //边框
      this.drawSelectedBorder(paint, this.size);
      /**
       * ### 在kit.render方法中使用了scale全局，这里需要矫正回来
       */
      paint.save();
      if (this.isMirror) paint.scale(-1, 1);
      //按钮
      this.updateButtons(paint);
      paint.restore();
    }
  }
  public performRenderSelected(paint: Painter): void {
    paint.save();
    paint.translate(this.positionX, this.positionY);
    paint.rotate(this.rect.getAngle);
    if (this.isMirror) paint.scale(-1, 1);
    this.renderSelected(paint, false);
    paint.restore();
  }
  /**
   * 该方法需要子类实现
   * @param paint
   */
  abstract drawImage(paint: Painter): void;
  /**
   * 被选中后外边框
   * @param paint
   */
  private selectedBorderColor: string = "#b2ccff";
  private selectedLineDash: Iterable<number> = [];
  private selectedLineWidth: number = 2;
  private selectedBorderPadding: number = 3;
  //设置被选中时描边颜色
  public setSelectedBorder(option: SelectedBorderStyle): void {
    this.selectedBorderColor = option?.borderColor || "#b2ccff";
    this.selectedLineDash = option?.lineDash || null;
    this.selectedLineWidth = option?.lineWidth || 2;
    this.selectedBorderPadding = option?.padding || 3;
  }
  public drawSelectedBorder(paint: Painter, size: Size): void {
    const screenUtils = this.getKit().getScreenUtil();
    const padding = screenUtils
      ? screenUtils.setSp(this.selectedBorderPadding)
      : this.selectedBorderPadding;
    paint.save();
    paint.beginPath();
    paint.lineWidth = screenUtils
      ? screenUtils.setSp(this.selectedLineWidth)
      : this.selectedLineWidth;
    paint.strokeStyle = this.selectedBorderColor;
    if (this.selectedLineDash) {
      paint.setLineDash(this.selectedLineDash);
    }
    paint.strokeRect(
      (~~this.width + padding) * -0.5,
      (~~this.height + padding) * -0.5,
      ~~this.width + padding,
      ~~this.height + padding
    );
    paint.closePath();
    paint.restore();
  }
  /**
   * 镜像翻转
   */
  public setMirror(isMirror: boolean) {
    this.isMirror = isMirror;
  }
  /**
   * @description 刷新按钮
   * @param paint
   */
  private updateButtons(paint: Painter): void {
    const rect: Rect = this.rect;
    const x: number = rect.position.x,
      y: number = rect.position.y;
    this.funcButton.forEach((button: Button) => {
      const len: number = button.getOriginDistance();
      if (button.disabled) return;
      const angle = this.rect.getAngle + button.oldAngle;
      const newx = Math.cos(angle) * len + x;
      const newy = Math.sin(angle) * len + y;
      const vector = new Vector(~~newx, ~~newy);
      button.updatePosition(vector);
      //运动时不显示按钮
      // if (this.delta.isZero)
      button.render(paint);
    });
  }
  public hide() {
    this.disabled = true;
    this.cancel();
  }
  public show() {
    this.disabled = false;
  }

  public getVertex(): Point[] {
    return this.rect.vertex?.getPoints();
  }
  public onSelected() {
    //被选中过后对所有图层点进行备份，不需要每次渲染都获取一次
    this.auxiliary?.createReferencePoint(this.key.toString());
    this.selected = true;
  }
  public cancel() {
    this.selected = false;
  }
  /*每次改变大小后都需要刷新按钮的数据*/
  public onChanged() {
    this.funcButton.forEach((item: BaseButton) => {
      // item.setMaster(this);
      item.reset();
    });
    //在下次运动前，delta应该置于0
    this.delta.cleanCurrentAndBefore();
  }
  //
  public onUpWithInner(paint: Painter) {
    /*在抬起鼠标时，ViewObject还没有被Calcel，为再次聚焦万向按钮做刷新数据*/
    this.onChanged();
    this.didEventUpWithInner();
  }
  public onUpWithOuter(paint: Painter): void {
    this.didEventUpWithOuter();
  }
  private readonly enlargeScale: number = 1.1;
  private readonly narrowScale: number = 1 / 1.1;
  public enlarge() {
    this.deltaScale = this.enlargeScale;
    this.setDeltaScale(this.deltaScale);
    this.doScale();
  }
  public narrow() {
    this.deltaScale = this.narrowScale;
    this.setDeltaScale(this.deltaScale);
    this.doScale();
  }
  private doScale() {
    if (this.isLock) return;
    this.onChanged();
  }
  /**
   * @description 瞬时缩放
   * @param deltaScale
   */
  public setDeltaScale(deltaScale: number) {
    const constraints = this.getScaleConstraints();
    const nextAbsScale = this.absoluteScale * deltaScale;
    this.delta.update(this.position);
    this.deltaScale = deltaScale;
    if (nextAbsScale < constraints.min) {
      this.rect.setAbsoluteScale(constraints.min);
      return;
    }
    if (nextAbsScale > constraints.max) {
      this.rect.setAbsoluteScale(constraints.max);
      return;
    }
    this.rect.setDeltaScale(deltaScale);
  }

  /**
   * 世界坐标居中
   */
  public center(canvasSize: Size, axis?: CenterAxis) {
    if (axis) {
      if (axis == "vertical")
        return (this.rect.position = new Vector(
          this.rect.position.x,
          canvasSize.height >> 1
        ));
      if (axis == "horizon")
        return (this.rect.position = new Vector(
          canvasSize.width >> 1,
          this.rect.position.y
        ));
    }
    const x = canvasSize.width >> 1,
      y = canvasSize.height >> 1;
    this.rect.position = new Vector(x, y);
  }

  public toCenter(axis?: CenterAxis): void {
    if (!this.mounted) return;
    this.getKit().center(this, axis);
  }

  _didChangeSize(size: Size): void {
    this.computedRespectRatio();
  }

  _didChangeDeltaScale(scale: number): void {
    this.computedRespectRatio();
  }

  private computedRespectRatio(): void {
    /**
     目前宽高/绝对倍数=真实宽高
     真实宽高/固定宽高=真是增长倍数
   */
    const deltaWidth = this.width / this.absoluteScale,
      deltaHeight = this.height / this.absoluteScale;
    this.renderBox.setScaleWidth(deltaWidth / this.fixedSize.width);
    this.setScaleHeight(deltaHeight / this.fixedSize.height);
  }
  _didChangePosition(position: Vector): void {
    if (!this.delta) this.delta = new Delta(position.x, position.y);
    this.delta.update(position.copy());
  }
  _didChangeScaleWidth(): void {
    if (!this.sizeDelta)
      this.sizeDelta = new Delta(this.size.width, this.size.height);
    this.sizeDelta.update(this.size.toVector());
  }
  /**
   * 撤销 | 取消撤销回调
   */
  public didFallback() {}

  /**
   * @description 提供公用基础信息导出
   * @returns
   */

  public async getBaseInfo(): Promise<ViewObjectExportBaseInfo> {
    const buttonPromises: Promise<ExportButton>[] = this.funcButton.map(
      (button: BaseButton) => {
        return button.export();
      }
    );
    const buttons: ExportButton[] = await Promise.all(buttonPromises);
    return {
      buttons: buttons,
      ...this.getBaseInfoSync(),
    };
  }

  public getBaseInfoSync(): ViewObjectExportBaseInfo {
    return {
      rect: {
        x: ~~this.rect.position.x,
        y: ~~this.rect.position.y,
        width: ~~this.width,
        height: ~~this.height,
        angle: this.rect.getAngle,
      },
      relativeRect: {
        x: ~~this.relativeRect.position.x,
        y: ~~this.relativeRect.position.y,
        width: ~~this.relativeRect.size.width,
        height: ~~this.relativeRect.size.height,
        angle: this.rect.getAngle,
      },
      fixedSize: this.fixedSize.toObject(),
      sizeScale: {
        scaleWidth: this.scaleWidth,
        scaleHeight: this.scaleHeight,
      },
      mirror: this.isMirror,
      locked: this.isLock,
      id: this.id,
      layer: this.getLayer(),
      isBackground: this.isBackground,
      opacity: this.opacity,
      platform: Platform.platform,
      decoration: this.decoration,
    };
  }

  /**
   * 自定义一些操作
   */
  public custom() {}

  public setOpacity(opacity: number): void {
    this.opacity = opacity;
  }
  onDown(e: Vector): boolean {
    const kit = this.getKit();
    const selected = CatchPointUtil.inArea(this.rect, e);
    if (selected) {
      this.drag.catchViewObject(this.rect, e);
      kit.select(this);
      return false;
    } else if (this.selected) {
      kit.cancel(this);
    }
    return super.onDown(e);
  }
  onMove(e: Vector): boolean {
    this.drag.update(e);
    return true;
  }
  onUp(e: Vector): boolean {
    this.cancelDrag();
    return true;
  }
  public cancelDrag() {
    this.drag.cancel();
  }
  onWheel(e: WheelEvent): void {
    const { deltaY } = e;
    if (this.selected)
      if (deltaY < 0) this.enlarge();
      else this.narrow();
  }
}

export default ViewObject;
