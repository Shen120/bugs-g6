import ShowHideAnchors from "../behavior/show-hide-anchors";
import AddEdge from "../behavior/add-edge";
import OverSelected from "../behavior/over-selected";
import G6 from "@antv/g6";
import ClickSelect from "../behavior/click-select";
import DragEdge from "../behavior/drag-edge";
import {typeColorMap} from "../lib/model";
import {DataType} from "../types";
import {ItemNode} from "../lib/itemModel";
import g6Cfg from "../config"
import {apply} from "ramda";

const {nodeShape, nodeWidth, nodeHeight, comboShape, childEdge, fieldEdge} = g6Cfg;

const behaviors: any = {
  "show-hide-anchors": ShowHideAnchors,
  "add-edge": AddEdge,
  "over-selected": OverSelected,
  // 自定义click-select，因为官方的有bug
  "cus-click-select": ClickSelect,
  "drag-edge": DragEdge,
};
// 注册行为
Object.keys(behaviors).forEach((key) => {
  G6.registerBehavior(key, behaviors[key]);
});

function getExpandIcon(cfg: any, isExpanded: boolean) {
  /*
   x轴 -12 是从右边向左偏移12px
   y轴 nodeHeight / 2 - 2 代表在节点的Y轴居中
  */
  // +号的path
  const add = [
    ["M", nodeWidth - 12, (nodeHeight / 2 - 2) - 6],
    ["L", nodeWidth - 12, (nodeHeight / 2 - 2) + 10],
    ["M", nodeWidth - 8 - 12, (nodeHeight / 2 - 2) + 2],
    ["L", nodeWidth + 8 - 12, (nodeHeight / 2 - 2) + 2],
  ];
  // -号的path
  const sub = [
    ["M", nodeWidth - 8 - 12, (nodeHeight / 2 - 2) + 2],
    ["L", nodeWidth + 8 - 12, (nodeHeight / 2 - 2) + 2],
  ];
  return isExpanded ? sub : add;
}

// 绘制锚点
function drawLittleCircle(model: any, group: any) {
  const bbox = group.getBBox();
  // @ts-ignore
  const anchorPoints = this.getAnchorPoints(model)
  anchorPoints.forEach((anchorPos: any, i: number) => {
    // 绘制小圆圈
    group.addShape('circle', {
      // zIndex: 30,
      attrs: {
        x: bbox.x + bbox.width * anchorPos[0],
        y: bbox.y + bbox.height * anchorPos[1],
        fill: '#fff',
        stroke: '#5F95FF',
        r: 5,
        cursor: "crosshair"
      },
      // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
      name: `anchor-point`, // the name, for searching by group.find(ele => ele.get('name') === 'anchor-point')
      anchorPointIdx: i, // flag the idx of the anchor-point circle
      links: 0, // cache the number of edges connected to this shape
      visible: false, // invisible by default, shows up when links > 1 or the node is in showAnchors state
      draggable: true // allow to catch the drag events on this shape,
    });
    // 绘制大圆圈
    group.addShape('circle', {
      // zIndex: 30,
      attrs: {
        x: bbox.x + bbox.width * anchorPos[0],
        y: bbox.y + bbox.height * anchorPos[1],
        r: 13,
        fill: 'rgba(84,152,255,.3)',
        stroke: 'rgba(84,152,255,.3)',
        cursor: "crosshair"
      },
      // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
      name: `tip-anchor-point`, // the name, for searching by group.find(ele => ele.get('name') === 'anchor-point')
      anchorPointIdx: i, // flag the idx of the anchor-point circle
      links: 0, // cache the number of edges connected to this shape
      visible: false, // invisible by default, shows up when links > 1 or the node is in showAnchors state
      draggable: true // allow to catch the drag events on this shape,
    });
  })
}

// 响应锚点、focus状态
function anchorPointsState(name: any, value: any, item: any) {
  if (name === 'showAnchors') {
    const anchorPoints = item.getContainer().findAll((ele: any) => ele.get('name') === 'anchor-point');
    anchorPoints.forEach((point: any) => {
      if (value) point.show()
      else point.hide()
    })
  }
  if (name === "showTipAnchors") {
    const tipAnchorPoints = item.getContainer().findAll((ele: any) => ele.get('name') === 'tip-anchor-point');
    tipAnchorPoints.forEach((point: any) => {
      if (value) point.show()
      else point.hide()
    })
  }
}

G6.registerNode(nodeShape, {
  setState: anchorPointsState,
  draw(cfg, group) {
    const label = cfg.label;
    // 绘制主shape
    const keyShape = group.addShape("rect", {
      // zIndex: 10,
      attrs: {
        stroke: "#f1f1f1",
        fill: "#fff",
        height: nodeHeight,
        width: nodeWidth,
        x: 0,
        y: 0,
      },
      draggable: true,
      // name: "main-rect",
      name: "rect-keyShape",
    })

    // 绘制label
    group.addShape("text", {
      // zIndex: 10,
      attrs: {
        text: label,
        fill: 'rgba(0,0,0,0.65)',
        fontSize: 14,
        textAlign: "center",
        y: nodeHeight / 2 + 10,
        x: 60,
        position: 'left',
      },
      draggable: true,
      name: "text-shape",
    })

    return keyShape;
  },
  afterDraw(cfg, group) {
    if (cfg && group) {
      const itemData = cfg as ItemNode;
      const fill = typeColorMap[itemData.dataType as DataType].color;
      // 绘制左边icon
      group.addShape("circle", {
        // zIndex: 10,
        attrs: {
          x: 20,
          y: nodeHeight / 2,
          r: 13,
          fill,
        },
        draggable: true,
        name: "node-icon-shape"
      });
      // 绘制左边icon中的文字
      group.addShape("text", {
        // zIndex: 10,
        attrs: {
          x: 20,
          y: nodeHeight / 2 + 8,
          text: (itemData.dataType as DataType).substring(0, 2).toUpperCase(),
          fill: "#fff",
          fontWeight: 600,
          fontSize: 12,
          textAlign: "center",
        },
        draggable: true,
        name: "node-icon-text"
      });

      // 绘制右边类型文字
      group.addShape("text", {
        // zIndex: 10,
        attrs: {
          x: nodeWidth - 30,
          y: nodeHeight / 2 + 8,
          text: itemData.dataType,
          fill: "#bbb",
          fontSize: 12,
          textAlign: "right",
        },
        draggable: true,
        name: "node-icon-text"
      });

      // 如果有子表，就渲染展开图标
      if (Array.isArray(itemData.children) && itemData?.children?.length > 0) {

        const isExpand = itemData?.expanded ?? false;
        group.addShape("path", {
          // zIndex: 10,
          attrs: {
            path: getExpandIcon(cfg, isExpand),
            stroke: '#000',
            lineWidth: 2,
            cursor: "pointer",
            lineAppendWidth: 8
          },
          name: "node-expand-icon"
        })
      }
      apply(drawLittleCircle.bind(this), [cfg, group]);
    }
  },
  update(cfg, node){
    if (cfg && node) {
      // 更新expand Icon
      const expandIcon = node.getContainer().find(ele => ele.get('name') === "node-expand-icon");
      if (expandIcon) {
        expandIcon.attr({
          path: getExpandIcon(cfg, (cfg.expanded ?? false) as boolean),
        })
      }
      // 更新文本 text-shape
      const textShape = node.getContainer().find(ele => ele.get('name') === "text-shape");
      if (textShape) {
        textShape.attr({
          text: cfg.label,
        })
      }
    }
  },
  getAnchorPoints() {
    return [
      [0, 0.5],
      [1, 0.5],
    ]
  },
}, 'single-node');

G6.registerCombo(comboShape, {
  afterDraw(cfg, group) {
    if (cfg && group) {
      const self = this;
      const style = self.getShapeStyle(cfg);
      group.addShape('rect', {
        // zIndex: 8,
        attrs: {
          ...style,
          fill: "#4089e3",
          width: style.width,
          height: 40,
        },
        draggable: true,
        name: "combo-title-rect"
      });
      const txtShape = group.getChildren().find((ele: any) => ele.get('name') === "text-shape");
      // txtShape?.setZIndex?.(9);
      const comboShape = group.getChildren().find((ele: any) => ele.get('name') === "rect-combo");
      console.log(comboShape, group.getChildren())
      // comboShape?.setZIndex?.(8);
      // group.sort();
    }
  },
  afterUpdate(cfg, item) {
    if (cfg && item) {
      const width = cfg.style?.width ?? 240;
      const height = cfg.style?.height ?? 40;
      const padding: number[] = (cfg?.padding as number[]) ?? [45, 10, 10, 10];

      const shape = item.getContainer().find((ele: any) => ele.get('name') === "combo-title-rect");
      if (shape) {
        shape.attr({
          x: -width / 2 - padding[3],
          y: -(height / 2) - padding[0],
          width: width + padding[1] + padding[3]
        })
      }
    }
  },
}, 'rect');

G6.registerEdge(childEdge, {
  afterUpdate(cfg, edge) {
    if (cfg && edge) {
      edge.toFront();
      const shape = edge.getContainer().find((ele: any) => ele.get('name') === "edge-shape");
      if (shape) {
        shape.setZIndex(20)
      }
    }
  },
}, "polyline")

export default G6;
