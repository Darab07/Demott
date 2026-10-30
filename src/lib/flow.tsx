import { createContext, useContext } from "react";

// Which demo the shared screens (tip, checkout) are part of.
export type Flow = "table" | "pickup";

export const FlowContext = createContext<Flow>("table");

export const useFlow = () => useContext(FlowContext);
