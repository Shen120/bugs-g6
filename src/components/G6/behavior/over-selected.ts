import {G6Event, ICanvas, IG6GraphEvent, IShapeBase} from "@antv/g6";

export default {
  startNode: null as string | null,
  getEvents(): { [key in G6Event]?: string } {
    return {
      "node:click": "onClick",
      "edge:click": "onEdgeClick",
      "canvas:click": "onCanvasClick",
      "mousedown": "onMouseDown",
      "onMouseUp": "onMouseUp",
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
  onClick(e: IG6GraphEvent) {
    this.toggleSelectedState(e, this, !e?.item?.hasState?.("Selected"));
  },
  onEdgeClick(e: IG6GraphEvent) {
    this.toggleSelectedState(e, this, false);
  },
  onCanvasClick(e: IG6GraphEvent) {
    // this.startNode = null;
    this.toggleSelectedState(e, this, false);
  },
  // 切换锚点的显隐状态
  toggleSelectedState(e: IG6GraphEvent, self: any, state: boolean) {
    if (!self.shouldBegin({selectedId: this.startNode, ...e}, self)) {
      return
    }
    const item = e?.item;
    const type = e?.item?.get?.("type");
    if (item || this.startNode) {
      self.graph.setItemState(item || this.startNode, 'Selected', type === "node" ? state : false);
    }
  }
}
