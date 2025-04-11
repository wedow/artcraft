import React, { useState } from "react";
import { useSpring, a } from "@react-spring/web";
import "./Tabs.scss";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface NonRouteTabProps {
  label: string;
  icon?: IconDefinition;
  isActive: boolean;
  onClick: () => void;
}

interface NonRouteTabsProps {
  tabs: {
    label: string;
    content: React.ReactNode;
    icon?: IconDefinition;
    padding?: boolean;
  }[];
}

function NonRouteTab({ label, icon, isActive, onClick }: NonRouteTabProps) {
  return (
    <li className="nav-item" onClick={onClick}>
      <div className={`nav-link fs-6 px-3 px-lg-4 ${isActive ? "active" : ""}`}>
        {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
        {label}
      </div>
    </li>
  );
}

function NonRouteTabs({ tabs }: NonRouteTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].label);
  const [fade, setFade] = useSpring(() => ({
    opacity: 1,
    from: { opacity: 0 },
    config: { duration: 300 },
  }));

  const handleTabClick = (tabLabel: string) => {
    if (tabLabel === activeTab) {
      return;
    }

    setFade({ opacity: 0 });
    setTimeout(() => {
      setActiveTab(tabLabel);
      setFade({ opacity: 1 });
    }, 50);
  };

  return (
    <nav>
      <ul className="nav nav-tabs">
        {tabs.map(tab => (
          <NonRouteTab
            key={tab.label}
            label={tab.label}
            icon={tab.icon}
            isActive={tab.label === activeTab}
            onClick={() => handleTabClick(tab.label)}
          />
        ))}
      </ul>
      {tabs.map(tab => {
        if (tab.label === activeTab) {
          return (
            <a.div key={tab.label} style={fade}>
              <div className={tab.padding ? "p-3 py-4 p-md-4" : ""}>
                {tab.content}
              </div>
            </a.div>
          );
        }
        return null;
      })}
    </nav>
  );
}

export default NonRouteTabs;
