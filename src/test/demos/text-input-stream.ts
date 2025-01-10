/**
 *
 * 聚焦事件，失焦事件，输入事件，设置空值
 * 此处UI表示GenUI框架，并不代表渲染层
 * 聚焦事件单向，UI调用API触发Native
 * 失焦事件双向，UI触发Native，Native 失焦回调UI
 * 输入时间单向，Native传入UI
 * 设置空值单向，UI触发Native
 *
 *
 * 1.何时聚焦。根据UI调用聚焦API而定
 * 2.何时失焦。UI主动触发失焦API使Native失焦。Native各种原因失焦后回调UI
 * 3.何时输入。聚焦后即可通过键盘输入，UI只需要监听Native输入回调即可。
 * 4.何时设置空值。问题由来：Input输入会累计历史输入文本，且UI的text值与Input值不能绑定必须分离。
 *    不能绑定原因:1.UI会选择Selection新增|删除|替换文本，如果绑定，Input则也需要设置Selection,但是各个平台这个API没有，为了兼容更多平台，选择更少的API，尽可能的在UI层做处理。
 *
 * 针对第4点做出方案，在每次输入后必须清空Input的text值，保证Input只作为一个输入流工具，文字拼接处理全权由UI层处理。
 * 清空时机:1.失焦后。2.改变光标位置后。
 *
 * 删除呢？
 *
 */

import { Offset } from "@/lib/basic/rect";
import { ChangeNotifier } from "@/lib/core/change-notifier";
import Stream from "@/lib/core/stream";
import { TextRange } from "@/lib/services/text-editing";
//@ts-ignore
import eruda from "eruda";

eruda.init();

export async function* NativeInputStream(): AsyncGenerator<string> {
  const text: HTMLInputElement = document.querySelector("#inputbar");
  let isComposition=false;
  while (true) {
    const key = await new Promise<string>((resolve) => {
      text.addEventListener("compositionstart", (e) => {
        isComposition=true;
        resolve(text.value);
      },{once:true});
      text.addEventListener("compositionend", (e) => {
        isComposition=false;
        resolve((e.target as HTMLInputElement).value);
      },{once:true});
      if(!isComposition){
        text.addEventListener("input", (e) => {
          resolve((e.target as HTMLInputElement).value);
        },{once:true});
      }
    });
    yield key; // 将按键返回给消费者
  }
}

export class TextSelection {
  public readonly baseOffset: number;
  public readonly extentOffset: number;
  constructor(baseOffset: number, extentOffset: number) {
    this.baseOffset = Math.min(baseOffset, extentOffset);
    this.extentOffset = Math.max(baseOffset, extentOffset);
  }
  static fromPosition(offset: Offset): TextSelection {
    return new TextSelection(offset.x, offset.y);
  }
  static get empty(): TextSelection {
    return new TextSelection(0, 0);
  }
  get lastOffset(): number {
    const forwardOffset = Math.max(this.baseOffset, this.extentOffset);
    const backwardOffset = Math.min(this.baseOffset, this.extentOffset);
    if (forwardOffset === backwardOffset) return forwardOffset;
    if (backwardOffset - forwardOffset === 1) return forwardOffset;
    return backwardOffset;
  }
  get single(): boolean {
    return this.baseOffset === this.extentOffset;
  }
}
export interface TextNativeInputStreamPayload{
  value:string,
  selectionStart:number,
  selectionEnd:number,
}
export class TextNativeInputAdapter extends ChangeNotifier{
  private stream: Stream<string>;
  private value: string = "";
  //(s,e]
  private selection: TextSelection = new TextSelection(1,1);
  constructor(stream: Stream<string>,defaultValue:string) {
    super();
    this.stream = stream;
    this.value = defaultValue;
    this.handleListenInput();
  }
  public async handleListenInput() {
    for await (const value of this.stream) {
      this.handleDiffText(value);
    }
  }

  private handleDiffText(newValue: string) {
    const diff = newValue.length - this.value.length; // 计算增量，判断是插入还是删除
    if (newValue.length === 0) return this.handleWhenValueIsEmpty();
    // 处理删除操作
    if (diff < 0) {
      if (this.selection.single) this.performDeleteTextSingle(newValue, diff);
      else this.performDeleteText(newValue, diff);
    } else {
      this.performInsertText(newValue, diff);
    }
  }
  private handleWhenValueIsEmpty() {
    this.value = "";
    this.handleSetSelection(TextSelection.empty);
    this.handleUpdateElementTextValue("");
  }
  private performDeleteTextSingle(newValue: string, diff: number) {
    const selection = this.selection;
    const oldValue = this.value;
    if (selection.lastOffset <= 0) {
      this.handleUpdateElementTextValue(oldValue);
      return;
    }
    // 删除操作意味着值被截断
    const deleteCount = Math.abs(diff);
    // 将文本分割成 FSL 和 RSL（分别代表光标前后的文本）
    const fst = oldValue.slice(0, selection.baseOffset-1);
    const lst = oldValue.slice(
      -1+selection.extentOffset + deleteCount
    ); // 删除操作后剩余的部分

    // 更新值
    const value = fst + lst;

    let newSelection = Math.max(0, selection.baseOffset - deleteCount); // 防止光标越界
    this.handleSetSelection(new TextSelection(newSelection, newSelection));
    this.handleUpdateElementTextValue(value);
  }
  private performDeleteText(newValue: string, diff: number) {
    const selection = this.selection;
    const oldValue = this.value;
    if (selection.lastOffset <= 0) {
      this.handleUpdateElementTextValue(oldValue);
      return;
    }
    // 删除操作意味着值被截断
    const deleteCount = Math.abs(diff);
    // 将文本分割成 FSL 和 RSL（分别代表光标前后的文本）
    const fst = oldValue.slice(0, selection.baseOffset);
    const lst = oldValue.slice(
      selection.extentOffset + deleteCount-1,
      oldValue.length
    ); // 删除操作后剩余的部分

    // 更新值
    const value = fst + lst;

    let newSelection = Math.max(0, selection.baseOffset); // 防止光标越界
    this.handleSetSelection(new TextSelection(newSelection, newSelection));
    this.handleUpdateElementTextValue(value);
  }
  private handleSetSelection(selection: TextSelection) {
    // 调整 selection 位置
    this.selection = selection;
  }
  private performInsertText(newValue: string, diff: number) {
    const oldValue = this.value;
    const selection = this.selection;

    // 获取新增的字符
    const insert = newValue.slice(oldValue.length, oldValue.length + diff);

    // 插入新的文本
    const fst = oldValue.slice(0, selection.baseOffset); // 光标前的文本
    const lst = oldValue.slice(selection.extentOffset); // 光标后的文本

    // 更新值
    const value = fst + insert + lst;
    this.handleUpdateElementTextValue(value);

    const lastOffset: number = selection.lastOffset + diff;
    const newSelection = new TextSelection(lastOffset, lastOffset);
    this.handleSetSelection(newSelection);
  }

  private handleUpdateElementTextValue(value: string) {
    this.value = value;
    const text: HTMLInputElement = document.querySelector("#inputbar");
    text.value = value;
    this.notifyListeners();
  }
  get payload(): TextNativeInputStreamPayload {
    return {
      value: this.value,
      selectionStart: this.selection.baseOffset,
      selectionEnd: this.selection.extentOffset,
    };
  }
  public updateSelection(selectionStart: number, selectionEnd: number) {
    console.log("更新Selection", selectionStart, selectionEnd);
    this.handleSetSelection(new TextSelection(selectionStart, selectionEnd));
  }
}

export const TextInputStreamDemo = () => {
  const syncStream = Stream.withAsync<string>(NativeInputStream());
  const handler: TextNativeInputAdapter = new TextNativeInputAdapter(
    syncStream,
    "123456"
  );
  // const inputStream = syncStream;
  // let value = "123456";
  // let selection = 3;
  // let nextEpochAccept = true;

  // // setTimeout(() => {
  // //   selection = 3;
  // //   console.log("改变Selection为3");
  // // }, 4000);

  // // 监听并处理键盘输入
  // (async () => {
  //   let i = 0;
  //   let key: string;

  //   for await (key of inputStream) {
  //     if (i++ > 100) {
  //       console.error("死循环");
  //       break;
  //     }

  //     const newValue: string = key;
  //     const diff = newValue.length - value.length; // 计算增量，判断是插入还是删除

  //     if (!nextEpochAccept) {
  //       nextEpochAccept = true;
  //       continue;
  //     }

  //     // 处理删除操作
  //     if (diff < 0) {
  //       console.log("删除操作", selection);
  //       if (selection <= 0) {
  //         const text: HTMLInputElement = document.querySelector("#inputbar");
  //         text.value = value;
  //         continue;
  //       }
  //       // 删除操作意味着值被截断
  //       const deleteCount = Math.abs(diff);
  //       // 将文本分割成 FSL 和 RSL（分别代表光标前后的文本）
  //       const fst = value.slice(0, selection - 1);
  //       const lst = value.slice(-1 + selection + deleteCount); // 删除操作后剩余的部分

  //       // 更新值
  //       value = fst + lst;

  //       // 调整 selection 位置
  //       selection = Math.max(0, selection - deleteCount); // 防止光标越界
  //       console.log("删除后的值", value);
  //     } else {
  //       // 输入操作
  //       console.log("输入操作");

  //       // 获取新增的字符
  //       const insert = newValue.slice(value.length, value.length + diff);

  //       // 插入新的文本
  //       const fst = value.slice(0, selection); // 光标前的文本
  //       const lst = value.slice(selection); // 光标后的文本

  //       // 更新值
  //       value = fst + insert + lst;

  //       // 更新光标位置
  //       selection += diff;

  //       console.log("新增了", insert);
  //       console.log("当前值", value);
  //     }

  //     // 更新 input 元素的值
  //     const text: HTMLInputElement = document.querySelector("#inputbar");
  //     text.value = value;

  //     // 打印当前的光标位置
  //     console.log("改变Selection", selection);
  //   }
  // })();
};

/**
 * 方案1，input 与 UI 同步
 * 
 * 

 */
