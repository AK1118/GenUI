import { Offset } from "../math/vector";
import { TextEditingValue, TextInput } from "../native/text-input";

/**
 * 文字范围
 */
export class TextRange {
  start: number;
  end: number;
  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
  static get zero(): TextRange {
    return new TextRange(-1, -1);
  }
  static get empty(): TextRange {
    return new TextRange(-1, -1);
  }
  get single(): boolean {
    return this.start === this.end;
  }
}
/**
 * 选定文字范围，包含起始位置和结束位置
 * 例如文字:"h|ello world",其中|表示光标。字符串全场11，则表示|可以标识的位置会从0~(11+1)个，此处光标|位置出现在1
 * 如 @TextSelection 的start=0,end=5，则被选取的文字为"hello"
 */
export class TextSelection extends TextRange {
  public readonly baseOffset: number;
  public readonly extentOffset: number;
  constructor(baseOffset: number, extentOffset: number) {
    super(baseOffset, extentOffset);
    this.baseOffset = baseOffset;
    this.extentOffset = extentOffset;
  }
  static fromPosition(offset: Offset): TextSelection {
    return new TextSelection(offset.x, offset.y);
  }
  static get empty(): TextSelection {
    return new TextSelection(-1, -1);
  }
  
}

export class TextInputConfiguration {}

export class TextEditingConnection {
  readonly client: TextInputClient;
  private _focused: boolean = false;
  constructor(client: TextInputClient) {
    this.client = client;
  }
  get focused(): boolean {
    return this._focused;
  }
  get attached(): boolean {
    return TextInput.instance.currentConnection === this;
  }
  show() {
    // if(this._focused)return;
    TextInput.instance.show();
    this._focused = true;
  }
  close() {
    // if(!this._focused)return;
    TextInput.instance.close();
    this._focused=false;
  }
  setSelection(newSelection: TextSelection): void {
    TextInput.instance.selectionHandler(newSelection);
  }
}

export interface TextInputClient {
  updateEditingValue(value: TextEditingValue): void;
}
