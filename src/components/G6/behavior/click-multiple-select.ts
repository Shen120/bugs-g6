import {G6Event, IG6GraphEvent, Item} from "@antv/g6";

interface IDefaultConfig {
  selectedState: "selected";
  includeEdges: boolean;
  includeCombos: boolean;
  selectedEdges: Item[];
  selectedNodes: Item[];
  selectedCombos: Item[];
}

export default {
  getDefaultCfg(): IDefaultConfig {
    return {
      selectedState: 'selected',
      includeEdges: true,
      includeCombos: false,
      selectedEdges: [],
      selectedNodes: [],
      selectedCombos: [],
    }
  },
  getEvents(): { [key in G6Event]?: string } {
    return {
      "node:click": "onClick",
      "edge:click": "onClick",
      "combo:click": "onClick",
      "canvas:click": "onCanvasClick",
    }
  },
  onCanvasClick(e: IG6GraphEvent) {

  },
  onClick(e: IG6GraphEvent) {
    // @ts-ignore
    window.getSelection?.().removeAllRanges?.();
    if (e.item) {
      const self: any = this;
      const type = e.item.getType();
      if (!self.shouldBegin(e, self)) {
        return
      }
      if (type === "node") {
        self.selectedNodes = self.handlerChange(self.selectedNodes, e.item);
      }
      if (type === "edge") {
        self.selectedEdges = self.handlerChange(self.selectedEdges, e.item);
      }
      if (type === "combo") {
        self.selectedCombos = self.handlerChange(self.selectedCombos, e.item);
      }
      self.graph.setItemState(e.item, self.selectedState, !e.item.hasState(self.selectedState));
      self.graph.emit('nodeselectchange', {
        selectedItems: {
          nodes: [...self.selectedNodes],
          edges: [...self.selectedEdges],
          combos: [...self.selectedCombos],
        },
        select: false,
      });
    }
  },
  handlerChange(arr: Item[], item: Item) {
    const newArr: Item[] = [...arr];
    const id = item.get("id");
    const idx = newArr.findIndex((node: Item) => node.get("id") === id);
    if (idx > -1) {
      newArr.splice(idx, 1);
    } else {
      newArr.push(item);
    }
    return newArr;
  },

}
