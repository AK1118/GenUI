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
import { TextAlign } from "../core/base-types";
import { Duration } from "../core/duration";
import Vector, { Offset } from "../math/vector";
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
  indicatorPainter: EditTextIndicatorPainter;
  textPainter: TextPainter;
}

export class Editable extends SingleChildRenderObjectWidget {
  private editingConnection: TextEditingConnection;
  private indicatorPainter: EditTextIndicatorPainter;
  private textPainter: TextPainter;
  constructor(args: Partial<EditableArguments>) {
    super(null, args?.key);
    this.editingConnection = args?.editingConnection;
    this.indicatorPainter = args?.indicatorPainter;
    this.textPainter = args?.textPainter;
  }
  createRenderObject(context?: BuildContext): RenderView {
    return new EditTextRenderView(
      this.editingConnection,
      this.indicatorPainter,
      this.textPainter
    );
  }
  updateRenderObject(
    context: BuildContext,
    renderView: EditTextRenderView
  ): void {
    renderView.textPainter = this.textPainter;
  }
}

export class EditableText extends StatefulWidget {
  createState(): State {
    return new EditableTextState();
  }
}

class EditableTextState extends State<EditableText> implements TextInputClient {
  private editingConnection: TextEditingConnection;
  private indicatorPainter: EditTextIndicatorPainter =
    new EditTextIndicatorPainter();
  private textPainter: TextPainter;
  private text: string = ``;
  public initState(): void {
    super.initState();
    this.editingConnection = TextInput.attach(this, null);
    this.textPainter = new TextPainter(this.textSpan);
  }
  updateEditingValue(value: TextEditingValue): void {
    if (!this.mounted) return;
    this.setState(() => {
      this.text = value.value;
      this.textPainter = new TextPainter(this.textSpan);
    });
    let selection: TextSelection = value.selection;
    if (selection.single) {
      const [box] = this.textPainter?.getTextBoxesForRange(selection) ?? [];
      this.handleUpdateIndicatorPosition(box, selection);
    }
  }
  /**
   * 随输入框输入位置变化而变化
   */
  private handleUpdateIndicatorPosition(rect: Rect, selection: TextSelection) {
    this.setState(() => {
      rect ??= Rect.zero;
      const currently_selection = selection.baseOffset;
      const offset = rect.offset;
      if (currently_selection !== -1) {
        offset.x += rect.width;
      }
      this.indicatorPainter.offset = offset;
      this.indicatorPainter.height = rect.height;
    });
  }
  get textSpan(): TextSpan {
    return new TextSpan({
      text: this.text,
      textStyle: new TextStyle({
        fontSize: 15,
        textAlign: TextAlign.justify,
      }),
    });
  }
  build(context: BuildContext): Widget {
    return new Editable({
      editingConnection: this.editingConnection,
      textPainter: this.textPainter,
      indicatorPainter: this.indicatorPainter,
    });
    // return new Text("测试文本输入框");
  }
}

export default EditableText;

export class EditTextIndicatorPainter extends CustomPainter {
  private _color: Color = Colors.black;
  private _thickness: number = 2;
  private _offset: Offset = Offset.zero;
  private _height: number = 13;
  // 保存上一帧Box的偏移量
  private _parentOffset: Offset = Offset.zero;
  private animationController = new AnimationController({
    duration: new Duration({ milliseconds: 500 }),
  });
  set parentOffset(value: Offset) {
    this._parentOffset = value;
  }
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
  show() { }
  hide() { }
  render(painter: Painter, size: Size): void {
    painter.fillStyle = this._color.rgba;
    const offset = this._parentOffset.add(this._offset);
    painter.fillRect(
      offset.x,
      offset.y,
      this._thickness,
      this._height
    );
  }
}
