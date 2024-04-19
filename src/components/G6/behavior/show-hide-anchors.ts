import {G6Event, ICanvas, IG6GraphEvent, IShapeBase} from "@antv/g6";

export default {
  startNode: null as string | null,
  overTarget: null as (IShapeBase & ICanvas | null),
  selectedNode: null as (IShapeBase & ICanvas | null),
  getEvents(): { [key in G6Event]?: string } {
    return {
      "node:mouseenter": "onMouseEnter",
      "node:mousedown": "onMouseDown",
      "node:mouseup": "onMouseUp",
      "node:mouseleave": "onMouseLeave",
      "node:mouseout": "onMouseOut",
      "node:mouseover": "onMouseOver",
      "node:dragenter": "onDragEnter",
      "node:dragleave": "onDragLeave",
      "node:dragstart": "onDragStart",
      "node:dragout": "onDragOut",
    }
  },
  onMouseDown(e: IG6GraphEvent) {
    // @ts-ignore
    if (e.originalEvent.button !== 0) {
      return
    }
    const item = e?.item;
    if (item) {
      this.startNode = item.get("id");
    }
  },
  onMouseUp() {
    this.startNode = null;
  },
  onMouseEnter(e: IG6GraphEvent) {
    const node = e.item?.get?.("id");
    if (node === this.startNode) {
      // 相同节点禁止连线，就不显示锚点了
      return
    }
    this.toggleAnchorsState(e, this, true);
  },
  onMouseOut() {
    if (this.overTarget) {
      this.overTarget.attr({
        fill: '#fff',
        stroke: '#1890ff',
        cursor: "crosshair"
      });
      this.overTarget = null;
    }
  },
  onMouseLeave(e: IG6GraphEvent) {
    this.toggleAnchorsState(e, this, false);
  },
  onMouseOver(e: IG6GraphEvent) {
    if (e.target.get("name") === "anchor-point") {
      this.overTarget = e.target;
      e.target.attr({
        fill: '#1890ff',
        cursor: "crosshair"
      })
    }
  },
  onDragEnter(e: IG6GraphEvent) {
    const node = e.item?.get?.("id");
    if (node === this.startNode) {
      // 相同节点禁止连线，就不显示锚点了
      return
    }
    this.toggleAnchorsState(e, this, true);
  },
  onDragLeave(e: IG6GraphEvent) {
    this.toggleAnchorsState(e, this, false);
  },
  onDragStart(e: IG6GraphEvent) {
    this.toggleAnchorsState(e, this, true);
  },
  onDragOut(e: IG6GraphEvent) {
    // this.startNode = null;
    this.toggleAnchorsState(e, this, false);
  },
// 切换锚点的显隐状态
  toggleAnchorsState(e: IG6GraphEvent, self: any, state: boolean) {
    if (!self.shouldEnd({sourceId: this.startNode, ...e}, self)) {
      return
    }
    if (e.item) {
      self.graph.setItemState(e.item, 'showAnchors', state);
    }
  }
}
