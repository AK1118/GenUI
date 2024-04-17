import ViewObject from "@/core/abstract/view-object";

class LayerManager {
  private readonly layers: Array<ViewObject> = [];
  public add(view: ViewObject): void {
    this.layers.push(view);
  }
  get count(): number {
    return this.layers.length;
  }
  /**
   * 获取一个可以被选中的图层
   * 选中条件
   * focused == null 且 上一层为fixedImage
   */
  public getAuthorityLayer() {}
  public remove() {}
}
