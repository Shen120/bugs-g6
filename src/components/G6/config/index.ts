import {G6ConfigParams} from "../types";

export default {
  selectedKey: "selected",
  triggerKeyField: "shiftKey",
  // 节点shape名
  nodeShape: "model-node",
  // 子表连接线shape名
  childEdge: 'child-edge',
  // 字段连接线shape名
  fieldEdge: "field-edge",
  // 节点高度
  nodeHeight: 40,
  // 节点宽度
  nodeWidth: 220,
  // 节点的icon的大小，因为是圆形，所以也代表直径
  nodeIconWidth: 26,
  // 节点组shape名
  comboShape: 'model-combo',
} as G6ConfigParams;