import Rect, { Size } from "../basic/rect";
import { AnimationController } from "../core/animation";
import { Clip, TextOverflow } from "../core/base-types";
import { Duration } from "../core/duration";
import { DownPointerEvent, PointerEvent } from "../gesture/events";
import { HitTestEntry } from "../gesture/hit_test";
import TapGestureRecognizer from "../gesture/recognizers/tap";
import Vector, { Offset } from "../math/vector";
import { Color, Colors } from "../painting/color";
import Painter from "../painting/painter";
import { TextPainter, TextSpan, TextStyle } from "../painting/text-painter";
import { CustomPainter } from "../rendering/custom";
import {
  TextEditingConnection,
  TextRange,
  TextSelection,
} from "../services/text-editing";
import { EditTextInsertionCaretPainter } from "../widgets/text";
import { PaintingContext, SingleChildRenderView } from "./basic";
import { AbstractNode } from "./render-object";

export class EditTextRenderView extends SingleChildRenderView {
  private textPainter: TextPainter;
  private hightLightPainter: EditTextHightLightPainter;
  private insertionCaretPainter: EditTextInsertionCaretPainter;
  private _editingConnection: TextEditingConnection;
  private needClip: boolean;
  private onTap: TapGestureRecognizer;
  constructor( _editingConnection: TextEditingConnection,insertionCaretPainter: EditTextInsertionCaretPainter,textPainter: TextPainter) {
    super();
    this._editingConnection = _editingConnection;
    this.insertionCaretPainter=insertionCaretPainter;
    this.textPainter=textPainter;
  }
  protected dropChild(child: AbstractNode): void {
    super.dropChild(child);
    this.onTap = new TapGestureRecognizer();
    this.onTap.onTap = this.handleTapDown.bind(this);
  }
  private handleTapDown(event: DownPointerEvent) {
    const textPoint = this.textPainter.getTextPointForOffset(event.position);
    if (!textPoint) return;
    let selectionIndex = textPoint.parentData.index;
    this._editingConnection.show();
    const selection=new TextSelection(selectionIndex, selectionIndex);
    this._editingConnection.setSelection(selection);
    const [box]=this.textPainter.getTextBoxesForRange(selection);
    if(box){
      if(this.handleSetInsertionCaretPositionByRect(box,event.position)){
        selectionIndex+=1;
        this._editingConnection.setSelection(new TextSelection(selectionIndex, selectionIndex));
      };
    }
  }
  private handleSetInsertionCaretPositionByRect(rect: Rect,position:Offset):boolean{
    let selectionOffset=false;
    const boxWidth=rect.width*.75;
    const offset=rect.offset;
    if(position.x-rect.x>boxWidth){
      offset.x=rect.right;
      selectionOffset=true;
    }
    this.insertionCaretPainter.offset = offset;
    this.insertionCaretPainter.height=rect.height;
    return selectionOffset;
  }
  handleEvent(event: PointerEvent, entry: HitTestEntry): void {
    super.handleEvent(event, entry);
    if (event instanceof DownPointerEvent) {
      this.onTap.addPointer(event);
    }
  }
  get isRepaintBoundary(): boolean {
    return true;
  }
  performLayout(): void {
    if (!this.hightLightPainter) {
      this.hightLightPainter = new EditTextHightLightPainter(this.textPainter);
      this.hightLightPainter.addListener(() => {
        this.markNeedsPaint();
      });
    }
    this.textPainter.layout(
      this.constraints.minWidth,
      this.constraints.maxWidth
    );
    const textSize = this.textPainter.size;
    this.size = this.constraints.constrain(textSize);
  }
  render(context: PaintingContext, offset?: Offset): void {
    if (!context.paint) return;
    if (this.needClip) {
      context.clipRectAndPaint(
        Clip.antiAlias,
        {
          x: offset?.x ?? 0,
          y: offset?.y ?? 0,
          width: this.size.width,
          height: this.size.height,
        },
        () => {
          this.hightLightPainter.render(context?.paint, this.size);
          this.textPainter.paint(context?.paint, offset);
        }
      );
    } else {
      this.hightLightPainter.render(context?.paint, this.size);
      this.textPainter.paint(context?.paint, offset);
    }
  }
  debugRender(context: PaintingContext, offset?: Offset): void {
    if (!context.paint) return;
    if (this.needClip) {
      context.clipRectAndPaint(
        Clip.antiAlias,
        {
          x: offset?.x ?? 0,
          y: offset?.y ?? 0,
          width: this.size.width,
          height: this.size.height,
        },
        () => {
          this.hightLightPainter.render(context?.paint, this.size);
          this.textPainter.paint(context?.paint, offset, true);
          this.insertionCaretPainter.render(context?.paint, this.size);
        }
      );
    } else {
      this.hightLightPainter.render(context?.paint, this.size);
      this.textPainter.paint(context?.paint, offset, true);
      this.insertionCaretPainter.render(context?.paint, this.size);
    }
  }
}

class EditTextHightLightPainter extends CustomPainter {
  private textPainter: TextPainter;
  private _textRange: TextRange = TextRange.zero;
  private _hightLightColor: Color = Colors.blue.withOpacity(0.5);
  constructor(textPainter: TextPainter) {
    super();
    this.textPainter = textPainter;
  }
  set textRange(value: TextRange) {
    this._textRange = value;
    this.notifyListeners();
  }
  get textRange(): TextRange {
    return this._textRange;
  }
  render(painter: Painter, size: Size): void {
    const boxes = this.textPainter.getTextBoxesForRange(new TextSelection(
      this.textRange.start,
      this.textRange.end
    ));
    painter.save();
    painter.fillStyle = this._hightLightColor.rgba;
    boxes.forEach((box) => {
      const rect = box;
      painter.fillRect(rect.x, rect.y, rect.width, rect.height);
    });
    painter.restore();
  }
}

