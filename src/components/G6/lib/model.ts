import {DataType, IGraphData, TypeColor} from "../types";

// 连接桩默认样式
export const portAttr = {
  show: {
    fill: '#fff',
    stroke: '#85A5FF',
  },
  hide: {
    fill: 'transparent',
    stroke: 'transparent',
  }
}

export const typeColorMap: TypeColor = {
  [DataType.int]: {color: "#41C9E2"},
  [DataType.bigint]: {color: "#ACE2E1"},
  [DataType.float]: {color: "#FFF455"},
  [DataType.double]: {color: "#C5FF95"},
  [DataType.char]: {color: "#A3FFD6"},
  [DataType.varchar]: {color: "#FB9AD1"},
  [DataType.text]: {color: "#C4E4FF"},
  [DataType.time]: {color: "#97E7E1"},
  [DataType.datetime]: {color: "#D20062"},
  [DataType.timestamp]: {color: "#15F5BA"},
  [DataType.bool]: {color: "#FF9800"},
  [DataType.blob]: {color: "#FF7ED4"},
  [DataType.arr]: {color: "#F9F07A"},
  [DataType.json]: {color: "#FEC7B4"},
  [DataType.enum]: {color: "#FDAF7B"},
}

export const lineCfg = {
  child: {name: "子表", color: "#2B2A4C"},
  relation: {name: "关系", color: "#5FBDFF"},
}

export const lineLegend = [
  {name: lineCfg.child.name, color: lineCfg.child.color, type: "solid"},
  {name: lineCfg.relation.name, color: lineCfg.relation.color, type: "dashed"},
]

export const defaultGraphData: IGraphData = {
  nodes: [],
  edges: [],
  combos: [],
}