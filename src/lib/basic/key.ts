import { ElementBinding } from "./binding";
import { Element } from "./elements";
import { Widget } from "./framework";

export abstract class Key {}
export class SimpleKey extends Key {
  private _value: string = Math.random().toString(16).substring(3);
  get value(): string {
    return this._value;
  }
}
export class GlobalKey extends SimpleKey {
  get currentElement(): Element {
    return ElementBinding.instance.buildOwner.getElementByGlobalKey(this);
  }
  get currentWidget(): Widget {
    return this.currentElement?.widget;
  }
}