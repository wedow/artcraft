import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSpring, a } from "@react-spring/web";
import "./Tabs.scss";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface TabProps {
  to: string;
  label: string;
  numberCount?: number;
  content?: React.ReactNode;
  icon?: IconDefinition;
  padding?: boolean;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabProps[];
  disabled?: boolean;
}

interface TabContentProps {
  children: React.ReactNode;
  padding?: boolean;
}

function Tab({
  to,
  label,
  numberCount,
  icon,
  onClick,
  disabled,
}: TabProps & { onClick: () => void }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        className={"nav-link fs-6 padding" + (disabled ? " disabled" : "")}
        activeClassName="active"
        onClick={onClick}
      >
        {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
        <div className="d-flex gap-2">
          {label}
          {numberCount && (
            <div className="number-count">{numberCount.toString() || "0"}</div>
          )}
        </div>
      </NavLink>
    </li>
  );
}

function TabContent({ children, padding }: TabContentProps) {
  const paddingClasses = padding ? "padding" : "";
  return <div className={`tab-content ${paddingClasses}`}>{children}</div>;
}

function Tabs({ tabs, disabled }: TabsProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const initialTab = tabs.find(tab => tab.to === currentPath) || tabs[0];
  const [activeTab, setActiveTab] = useState(initialTab.to);

  const [fade, setFade] = useSpring(() => ({
    opacity: 1,
    from: { opacity: 0 },
    config: { duration: 50 },
  }));

  useEffect(() => {
    setFade({ opacity: 1 });
  }, [activeTab, setFade]);

  useEffect(() => {
    setActiveTab(currentPath);
  }, [currentPath]);

  const handleTabClick = (tabTo: string) => {
    if (activeTab === tabTo) {
      return;
    }
    setFade({ opacity: 0 });
    setTimeout(() => setActiveTab(tabTo), 50);
  };

  const activeTabProps = tabs.find(tab => tab.to === activeTab);

  return (
    <nav>
      <ul className="nav nav-tabs">
        {tabs.map(tab => (
          <Tab
            key={tab.to}
            to={tab.to}
            label={tab.label}
            numberCount={tab.numberCount}
            onClick={() => handleTabClick(tab.to)}
            icon={tab.icon}
            disabled={disabled || tab.disabled}
          />
        ))}
      </ul>
      <TabContent padding={activeTabProps?.padding}>
        <a.div
          style={fade}
          className={`tab-pane fade ${
            activeTab === activeTabProps?.to ? "show active" : ""
          }`}
        >
          {activeTabProps?.content}
        </a.div>
      </TabContent>
    </nav>
  );
}

export default Tabs;
