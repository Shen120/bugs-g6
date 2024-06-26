import { each } from '@antv/util';
import { G6Event, IG6GraphEvent } from '@antv/g6-core';

const DEFAULT_TRIGGER = 'shift';
const ALLOW_EVENTS = ['shift', 'ctrl', 'alt', 'control'];

export default {
  getDefaultCfg(): any {
    return {
      multiple: true,
      trigger: DEFAULT_TRIGGER,
      selectedState: 'selected',
      selectNode: true,
      selectEdge: false,
      selectCombo: true,
    };
  },
  getEvents(): { [key in G6Event]?: string } {
    const self = this as any;
    // 检测输入是否合法
    if (!(ALLOW_EVENTS.indexOf(self.trigger.toLowerCase()) > -1)) {
      self.trigger = DEFAULT_TRIGGER;
      // eslint-disable-next-line no-console
      console.warn(
        "Behavior click-select 的 trigger 参数不合法，请输入 'drag'、'shift'、'ctrl' 或 'alt'",
      );
    }
    if (!self.multiple) {
      return {
        'node:click': 'onClick',
        'combo:click': 'onClick',
        'edge:click': 'onClick',
        'canvas:click': 'onCanvasClick',
      };
    }
    return {
      'node:click': 'onClick',
      'combo:click': 'onClick',
      'edge:click': 'onClick',
      'canvas:click': 'onCanvasClick',
      keyup: 'onKeyUp',
      keydown: 'onKeyDown',
    };
  },
  onClick(evt: IG6GraphEvent) {
    // @ts-ignore
    window.getSelection?.().removeAllRanges?.();
    const self: any = this;
    const { item } = evt;
    if (!item || item.destroyed) {
      return;
    }

    const type = item.getType();
    const { graph, keydown, multiple, shouldUpdate, shouldBegin } = self;
    if (!shouldBegin(evt, self)) {
      return;
    }

    // allow to select multiple nodes but did not press a key || do not allow the select multiple nodes
    if (!keydown || !multiple) {
      const selected = graph.findAllByState('node', self.selectedState)
        .concat(graph.findAllByState('edge', self.selectedState))
        .concat(graph.findAllByState('combo', self.selectedState));
      each(selected, (selectedItem) => {
        if (selectedItem !== item) {
          graph.setItemState(selectedItem, self.selectedState, false);
        }
      });
    }

    // check if the item could be selected, given the current cfg
    const itemSelectable = (() => {
      switch (type) {
        case 'node':
          return self.selectNode;
        case 'edge':
          return self.selectEdge;
        case 'combo':
          return self.selectCombo;
        default:
          return false;
      }
    })();
    if (!itemSelectable) {
      const selectedNodes = graph.findAllByState('node', self.selectedState);
      const selectedEdges = graph.findAllByState('edge', self.selectedState);
      const selectedCombos = graph.findAllByState('combo', self.selectedState);
      graph.emit('nodeselectchange', {
        selectedItems: {
          nodes: selectedNodes,
          edges: selectedEdges,
          combos: selectedCombos,
        },
        select: false,
      });
      return;
    }

    if (item.hasState(self.selectedState)) {
      if (shouldUpdate(evt, self)) {
        graph.setItemState(item, self.selectedState, false);
      }
      const selectedNodes = graph.findAllByState('node', self.selectedState);
      const selectedEdges = graph.findAllByState('edge', self.selectedState);
      const selectedCombos = graph.findAllByState('combo', self.selectedState);
      graph.emit('nodeselectchange', {
        target: item,
        selectedItems: {
          nodes: selectedNodes,
          edges: selectedEdges,
          combos: selectedCombos,
        },
        select: false,
      });
    } else {
      if (shouldUpdate(evt, self)) {
        graph.setItemState(item, self.selectedState, true);
      }
      const selectedNodes = graph.findAllByState('node', self.selectedState);
      const selectedEdges = graph.findAllByState('edge', self.selectedState);
      const selectedCombos = graph.findAllByState('combo', self.selectedState);
      graph.emit('nodeselectchange', {
        target: item,
        selectedItems: {
          nodes: selectedNodes,
          edges: selectedEdges,
          combos: selectedCombos,
        },
        select: true,
      });
    }
  },
  onCanvasClick(evt: IG6GraphEvent) {
    // @ts-ignore
    window.getSelection?.().removeAllRanges?.();
    const { graph, shouldBegin } = this as any;
    const self = this as any;
    if (!shouldBegin(evt, this)) {
      return;
    }

    const selected = graph.findAllByState('node', self.selectedState);
    each(selected, (node) => {
      graph.setItemState(node, self.selectedState, false);
    });

    const selectedEdges = graph.findAllByState('edge', self.selectedState);
    each(selectedEdges, (edge) => {
      graph.setItemState(edge, self.selectedState, false);
    });

    const selectedCombos = graph.findAllByState('combo', self.selectedState);
    each(selectedCombos, (combo) => {
      graph.setItemState(combo, self.selectedState, false);
    });
    graph.emit('nodeselectchange', {
      selectedItems: { nodes: [], edges: [], combos: [] },
      select: false,
    });
  },
  onKeyDown(e: IG6GraphEvent) {
    const self: any = this;
    const code = e.key;
    if (!code) {
      return;
    }
    if (code.toLowerCase() === self.trigger.toLowerCase()) {
      self.keydown = true;
    } else {
      self.keydown = false;
    }
  },
  onKeyUp() {
    const self = this;
    (self as any).keydown = false;
  },
};
