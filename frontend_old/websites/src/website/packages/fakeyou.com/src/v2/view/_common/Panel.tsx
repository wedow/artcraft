import React from "react";
import { motion } from "framer-motion";
import { panel } from "data/animation";

interface PanelProps {
  children: React.ReactNode;
  padding?: boolean;
}

function Panel(props: PanelProps) {
  return (
    <motion.div className="container-panel" variants={panel}>
      <div className={`panel ${props.padding ? "p-3 py-4 p-md-4" : ""}`}>
        {props.children}
      </div>
    </motion.div>
  );
}

export { Panel };
