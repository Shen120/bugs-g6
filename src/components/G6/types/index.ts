import {Graph, IEdge, IG6GraphEvent, INode, Item} from "@antv/g6";
import {ComboConfig, GraphData} from "@antv/g6-core/lib/types";
import {IPluginBaseConfig} from "@antv/g6-plugin/lib/base";
import React from "react";
import {MenuProps} from "antd/lib/menu";
import {ItemEdge, ItemNode} from "../lib/itemModel";

export type Path = [string, number, number][];
export type Offset = { x: number, y: number };
export type Segments = {
  start: Offset,
  end: Offset,
};

export type ColorType = string | null;

export type ShapeType = "circle" | 'rect';
export type Position = "up" | "left" | "down" | "right";

export interface RectPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  shapeType: ShapeType;
}

export type PointOffset = Omit<RectPoint, "width" | "height" | "shapeType">;

export interface INodeModel extends INode, ItemNode{

}

export interface IEdgeModel extends IEdge, ItemEdge{
  id: string;
  source: string;
  target: string;
}

export type IGraphData = {
  nodes: INodeModel[],
  edges: IEdgeModel[],
  combos: ComboConfig[];
};

export enum DataType {
  int = "int",
  bigint = "bigint",
  float = 'float',
  double = "double",
  char = "char",
  varchar = 'varchar',
  text = "text",
  time = "time",
  datetime = "datetime",
  timestamp = "timestamp",
  bool = "boolean",
  blob = "blob",
  arr = 'array',
  json = 'json',
  enum = "enum",
}

export type TypeColor = {
  [key in DataType]: {
    color: string;
  };
};

export interface IItemParams {
  item: ItemNode,
  parentID: string,
  index: number,
  titleHeight?: number,
}

export interface GraphCtx {
  graph?: Graph;
  expandOption: {
    expand: { [key: string]: any[] },
    onChange?: (nodeId: string, expandValue: any[]) => void,
  }
}

interface TooltipConfig extends IPluginBaseConfig {
  getContent?: (evt?: IG6GraphEvent) => HTMLDivElement | string;
  offsetX?: number;
  offsetY?: number;
  shouldBegin?: (evt?: IG6GraphEvent) => boolean;
  itemTypes?: string[];
  trigger?: 'mouseenter' | 'click';
  fixToNode?: [number, number] | undefined;
}

export interface ContextMenuVisibleConfig {
  // 是否显示编辑分组的菜单项
  edit?: {
    copy?: boolean;
    paste?: boolean;
    delete?: boolean;
  };
  // 是否显示创建分组的菜单项
  create?: boolean;
}

export interface MenuItem {
  key: string;
  label: string;
  title: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: string
  children?: MenuItem[];
}

export interface ContextMenuProps extends MenuProps {
  x: number;
  y: number;
  // 弹出菜单的偏移量
  offset?: number;
  getRef?: (ref: any) => void;
  items: MenuItem[];
}

export interface G6ReactProps<GData extends GraphData> {
  containerWidth: number;
  containerHeight: number;
  data?: { nodes: GData[]; edges: GData[] };
  backgroundImage?: any;
  showTooltip?: boolean;
  multipleState?: boolean;
  // 已展开的列表
  expanded?: string[];
  onMultipleStateChange?: (state: boolean) => void;
  onHoldDownKeyStateChange?: (state: boolean) => void;
  tooltipConfig?: TooltipConfig,
  getGraph?: (graph: Graph) => void;
  // 格式化edge的tooltip，与ToolTip插件分开
  formatEdgeText?: (model: GData) => string;
  // 通用事件-单击鼠标左键或者按下回车键时触发
  onClick?: (e: IG6GraphEvent) => void;
  // 	通用事件-双击鼠标左键时触发，同时会触发两次 click
  onDblClick?: (e: IG6GraphEvent) => void;
  // 通用事件-释放键盘键触发该事件
  onKeyup?: (e: IG6GraphEvent) => void;
  // 通用事件-按下键盘键触发该事件
  onKeydown?: (e: IG6GraphEvent) => void;
  // 鼠标移入画布时触发
  onCanvasMouseenter?: (e: IG6GraphEvent) => void;
  // 鼠标移出画布时触发
  onCanvasMouseleave?: (e: IG6GraphEvent) => void;
  onNodeExpand?: (e: IG6GraphEvent, expanded: boolean) => void;
  // 鼠标左键单击画布时触发
  onCanvasClick?: (e: IG6GraphEvent) => void;
  // 鼠标移入边时触发
  onEdgeMouseenter?: (e: IG6GraphEvent) => void;
  // 鼠标单击节点时触发
  onNodeClick?: (e: IG6GraphEvent) => void;
  // 单击连接线时触发
  onEdgeClick?: (e: IG6GraphEvent) => void;
  // 鼠标按钮在边上按下（左键或者右键）时触发，不能通过键盘触发
  onEdgeMouseDown?: (e: IG6GraphEvent) => void;
  // 鼠标移出边时触发
  onEdgeMouseleave?: (e: IG6GraphEvent) => void;
  // 使用了 'brush-select' , 'click-select' 或 'lasso-select' Behavior 且选中元素发生变化时，该事件被触发
  onNodeSelectChange?: (e: IG6GraphEvent) => void;
  // 使用内置交互 create-edge，创建边之前触发
  onBeforeCreateEdge?: (e: IG6GraphEvent) => void;
  // 使用内置交互 create-edge，创建边之后触发
  onAfterCreateEdge?: (e: IG6GraphEvent) => void;
  // 调用 graph.remove / graph.removeItem 方法之后触发
  onAfterRemoveItem?: (e: IG6GraphEvent) => void;
  // 调用 graph.update / graph.updateItem 方法之后触发
  onAfterUpdateItem?: (e: IG6GraphEvent) => void;
  // 调用 graph.remove / graph.removeItem 方法之前触发
  onBeforeRemoveItem?: (e: IG6GraphEvent) => void;
  // 调用 graph.add / graph.addItem 方法之后触发
  onAfterAddItem?: (e: IG6GraphEvent) => void;
  // add-edge模式中阻止边添加的回调函数
  onAddEdgeShouldEnd?: (e: IG6GraphEvent, self: any) => boolean;
  // add-edge模式中阻止显示tip anchor的回调函数
  onAddEdgeShouldShowAnchor?: (e: IG6GraphEvent, self: any) => boolean;
  // show-hide-anchors模式中阻止锚点显示的回调函数
  onShowHideAnchorsShouldEnd?: (
    e: IG6GraphEvent & { sourceId?: string },
    self: any
  ) => boolean;
  // show-hide-anchors模式中阻止锚点显示的回调函数
  onOverSelectedShouldEnd?: (
    e: IG6GraphEvent & { selectedId?: string },
    self: any
  ) => boolean;
  // 点击右键菜单按钮时触发；注意：paste时item并非Item类型，而是纯节点数据
  onContextMenuClick?: (data: any, item?: Item, e?: IG6GraphEvent | null,) => void;
  // 根据条件显示右键菜单
  beforeShowContextMenu?: (item?: Item, copyItem?: Item) => ContextMenuVisibleConfig;
  // 快捷键调用
  onShortcutCall?: (key: string, item?: Item) => void;
  beforeShowShortcutMenu?: (item?: Item) => boolean;
  onEdgeDragend?: (e: { item: GData }) => void;
}

export interface GraphCustomPrams {
  // 清除所有元素选中状态
  clearState?: () => void;
}

export interface GraphParams extends Graph, GraphCustomPrams {

}

export interface G6ReactRef {
  graph: Graph & GraphCustomPrams | null;
}

export interface G6ConfigParams {
  selectedKey: string;
  triggerKeyField: string;
  nodeShape: string;
  childEdge: string;
  fieldEdge: string;
  comboShape: string;
  nodeHeight: number;
  nodeWidth: number;
  nodeIconWidth: number;
}
export interface GraphContextParams {
  graph?: Graph;
  updateNode: (idList: string[], cfg: Partial<ItemNode>) => void;
}