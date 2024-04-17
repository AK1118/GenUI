import ViewObject from "@/core/abstract/view-object";
export enum LayerOperationType {
  //下降一层
  lower,
  //上升一层
  rise,
  //至于顶层
  top,
  //至于底层
  bottom,
  //不执行操作
  none,
}
class _Tools {
  /**
   * @description 传入 @ViewObject 对象，设置该对象的layer层级
   * @param selectedViewObject
   */
  public arrangeLayer(
    ViewObjectList: Array<ViewObject>,
    selectedViewObject: ViewObject,
    operationType: LayerOperationType
  ): void {
    if (operationType == LayerOperationType.none || !selectedViewObject) {
      return this.sortByLayer(ViewObjectList);
    }
    //对象是否在数组中
    const ndx = ViewObjectList.findIndex(
      (item: ViewObject) => item.key === selectedViewObject.key
    );
    if (ndx === -1) return;

    //所有对象数量
    const len = ViewObjectList.length - 1;

    /**
     * 排序规则，layer越大，数组下标越大
     * 向上一级操作 => layer设置为 i+i 的layer+1
     */
    switch (operationType) {
      //图层向上移，layer增大,下标增大
      // current = next+1
      case LayerOperationType.rise:
        {
          if (ndx === len) break;
          const current = selectedViewObject,
            next = ViewObjectList[ndx + 1];
          current.setLayer(next.getLayer() + 1);
        }
        break;
      //图层向下移动，layer减小,下标减小
      // current=pre-1
      case LayerOperationType.lower:
        {
          if (ndx === 0) break;
          const current = selectedViewObject,
            next = ViewObjectList[ndx - 1];
          current.setLayer(next.getLayer() - 1);
        }
        break;
      //最高图层   current=max +1
      case LayerOperationType.top:
        {
          const max = ViewObjectList[len];
          const current = selectedViewObject;
          current.setLayer(max.getLayer() + 1);
          // 交换图层
        }
        break;
      //最低图层   current=min-1
      case LayerOperationType.bottom:
        {
          const min = ViewObjectList[0];
          const current = selectedViewObject;
          current.setLayer(min.getLayer() - 1);
        }
        break;
    }
    this.sortByLayer(ViewObjectList);
  }

  public sortByLayer(ViewObjectList: Array<ViewObject>): void {
    ViewObjectList.sort(
      (a: ViewObject, b: ViewObject) => a.getLayer() - b.getLayer()
    );
  }
}

export default _Tools;
