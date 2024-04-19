import React from "react";
import {GraphContextParams} from "../types";

export const GraphContext = React.createContext<GraphContextParams>({
  updateNode: () => {}
})