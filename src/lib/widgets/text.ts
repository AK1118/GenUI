import { BuildContext } from "../basic/elements";
import {
  SingleChildRenderObjectWidget,
  SingleChildRenderObjectWidgetArguments,
  State,
  StatefulWidget,
  Widget,
} from "../basic/framework";
import { Key } from "../basic/key";
import Rect, { Size } from "../basic/rect";
import { AnimationController } from "../core/animation";
import { Duration } from "../core/duration";
import { Offset } from "../math/vector";
import { TextEditingValue, TextInput } from "../native/text-input";
import { Color, Colors } from "../painting/color";
import Painter from "../painting/painter";
import { TextPainter, TextSpan, TextStyle } from "../painting/text-painter";
import { RenderView } from "../render-object/render-object";
import { EditTextRenderView } from "../render-object/text";
import { CustomPainter } from "../rendering/custom";
import {
  TextEditingConnection,
  TextInputClient,
  TextSelection,
} from "../services/text-editing";

interface EditableArguments {
  text: TextSpan;
  editingConnection: TextEditingConnection;
  key: Key;
  insertionCaretPainter: EditTextInsertionCaretPainter;
  textPainter: TextPainter;
}

export class Editable extends SingleChildRenderObjectWidget {
  private editingConnection: TextEditingConnection;
  private insertionCaretPainter: EditTextInsertionCaretPainter;
  private textPainter: TextPainter;
  constructor(args: Partial<EditableArguments>) {
    super(null, args?.key);
    this.editingConnection = args?.editingConnection;
    this.insertionCaretPainter = args?.insertionCaretPainter;
    this.textPainter = args?.textPainter;
  }
  createRenderObject(context?: BuildContext): RenderView {
    return new EditTextRenderView(
      this.editingConnection,
      this.insertionCaretPainter,
      this.textPainter
    );
  }
  updateRenderObject(
    context: BuildContext,
    renderView: EditTextRenderView
  ): void {

  }
}

export class EditableText extends StatefulWidget {
  createState(): State {
    return new EditableTextState();
  }
}

class EditableTextState extends State<EditableText> implements TextInputClient {
  private editingConnection: TextEditingConnection;
  private insertionCaretPainter: EditTextInsertionCaretPainter =
    new EditTextInsertionCaretPainter();
  private textPainter: TextPainter;
  private text: string = `测试,好文本`;
  public initState(): void {
    super.initState();
    this.editingConnection = TextInput.attach(this, null);
    this.textPainter=new TextPainter(this.textSpan);
  }
  updateEditingValue(value: TextEditingValue): void {
    if(!this.mounted)return;
    this.setState(() => {
      this.text = value.value;
      this.textPainter=new TextPainter(this.textSpan);
    });
    let selection: TextSelection = value.selection;
    console.log("二年至",this.textPainter);
    if (selection.single) {
      const [box] = this.textPainter?.getTextBoxesForRange(selection);
      if (box) {
        this.handleSetInsertionCaretPositionByRect(box);
      }
    }
  }
  /**
   * 随输入框输入位置变化而变化
   */
  private handleSetInsertionCaretPositionByRect(rect: Rect) {
    const offset = rect.offset;
    this.insertionCaretPainter.offset = offset;
    this.insertionCaretPainter.height = rect.height;
  }
  get textSpan(): TextSpan {
    return new TextSpan({
      text: this.text,
      textStyle: new TextStyle({
        fontSize: 20,
      }),
    });
  }
  build(context: BuildContext): Widget {
    
    return new Editable({
      editingConnection: this.editingConnection,
      textPainter: this.textPainter,
      insertionCaretPainter: this.insertionCaretPainter,
    });
  }
}

export default EditableText;

export class EditTextInsertionCaretPainter extends CustomPainter {
  private _color: Color = Colors.black;
  private _thickness: number = 2;
  private _offset: Offset = Offset.zero;
  private _height: number = 13;
  private animationController = new AnimationController({
    duration: new Duration({ milliseconds: 500 }),
  });
  set color(value: Color) {
    this._color = value;
    this.notifyListeners();
  }
  set thickness(value: number) {
    this._thickness = value;
    this.notifyListeners();
  }
  set offset(value: Offset) {
    this._offset = value;
    this.notifyListeners();
  }
  set height(value: number) {
    this._height = value;
    this.notifyListeners();
  }
  constructor() {
    super();
  }
  show() {}
  hide() {}
  render(painter: Painter, size: Size): void {
    painter.fillStyle = this._color.rgba;
    painter.fillRect(
      this._offset.x,
      this._offset.y,
      this._thickness,
      this._height
    );
  }
}
