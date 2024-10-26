import { BindingBase } from "../basic/framework";
import {
  TextEditingConnection,
  TextInputClient,
  TextInputConfiguration,
  TextSelection,
} from "../services/text-editing";
type SetSelectionCallback = (newSelection: TextSelection) => void;
export class NativeTextInputHandler {
  private binding: NativeTextInput =TextInput.instance;
  updateEditingValue(text: string, start: number, end: number) {
    this.binding.updateEditingValue(text, start, end);
  }
  selectionHandler(setSelection: SetSelectionCallback) {
    this.binding.selectionHandler = setSelection;
  }
  focusHandler(focus: VoidFunction) {
    this.binding.focus = focus;
  }
  blurHandler(blur: VoidFunction) {
    this.binding.blur = blur;
  }
}

abstract class NativeTextInput extends BindingBase {
  focus(): void {
    console.warn("Focus not implemented");
  }
  blur(): void {
    console.warn("Blur not implemented");
  }
  selectionHandler(newSelection: TextSelection) {
    console.warn("Input not implemented");
  }
  updateEditingValue(
    text: string,
    selectionStart: number,
    selectionEnd: number
  ): void {
    
  }
}

export class TextInput extends NativeTextInput {
  private static _instance: TextInput;
  private _currentConnection: TextEditingConnection;
  private _currentConfig: TextInputConfiguration;
  get currentConfig(): TextInputConfiguration {
    return this._currentConfig;
  }
  get currentConnection(): TextEditingConnection {
    return this._currentConnection;
  }

  static get instance(): TextInput {
    if (!this._instance) {
      this._instance = new TextInput();
    }
    return this._instance;
  }
  static attach(
    client: TextInputClient,
    config: TextInputConfiguration
  ): TextEditingConnection {
    const connection = new TextEditingConnection(client);
    TextInput.instance._attach(connection, config);
    return connection;
  }
  _attach(
    connection: TextEditingConnection,
    config: TextInputConfiguration
  ): void {
    this._currentConfig = config;
    this._currentConnection = connection;
  }
  static removeClient(): void {
    this._instance._currentConfig = null;
    this._instance._currentConnection = null;
  }
  show() {
    this.focus();
  }
  close() {
    this.blur();
  }
  updateEditingValue(text: string,
    selectionStart: number,
    selectionEnd: number): void {
    if (this.currentConnection?.attached) {
      const value = new TextEditingValue(text, new TextSelection(selectionStart,selectionEnd));
      this._currentConnection.client.updateEditingValue(value);
    }
  }
}

export class TextEditingValue {
  public readonly selection: TextSelection;
  public readonly value: string;
  constructor(value: string, selection: TextSelection) {
    this.value = value;
    this.selection = selection;
  }
}
