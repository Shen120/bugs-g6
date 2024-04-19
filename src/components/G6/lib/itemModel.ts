import {DataType} from "../types";
import g6Cfg from "../config/index";
import {guid} from "../utils";

export class ItemNode {
  id: string = guid();
  label: string = "";
  dataType: DataType = DataType.text;
  children?: ItemNode[];
  expanded?: boolean;
  x: number = 0;
  y: number = 0;
  type: string = g6Cfg.nodeShape;
  [key: string]: unknown; // 其他业务属性
}

export class ItemEdge {
  type: string = "polyline"; // 元素类型，e.g. 可能是 line-edge
  label?: string; // label 的文本
  sourceAnchor?: number;
  targetAnchor?: number;
  [key: string]: unknown; // 其他业务属性
  id: string = guid();
}