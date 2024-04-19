import { Graph } from '@antv/g6';

declare global {
  interface Window {
    graph?: Graph & {
      getNodesInfo?: () => void;
      clearState?: () => void;
    };
  }
}
