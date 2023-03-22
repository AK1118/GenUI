import { RecordNode } from "../abstract/operation-observer";
import Rect from "../rect";

interface RecorderInterface{
  fallback():Promise<RecordNode>;
  cancelFallback():Promise<RecordNode>;
  push(rect:RecordNode):void;
  commit():void;
  cache:RecordNode;
  setNow(rect:RecordNode):void;
  setCache(rect:RecordNode):void;
}

export default RecorderInterface;
