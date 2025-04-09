import React, { useRef, useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "~/components";

export interface TabItem {
  id: string;
  label: string;
}

interface TabSelectorProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
  disabled,
  disabledMessage,
}) => {
  // Find the index of the active tab
  const selectedIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const tabsRef = useRef<(HTMLElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  // Handle tab change
  const handleTabChange = (index: number) => {
    onTabChange(tabs[index].id);
  };

  // Update the indicator position when the selected tab changes
  useEffect(() => {
    if (selectedIndex >= 0 && tabsRef.current[selectedIndex]) {
      const currentTab = tabsRef.current[selectedIndex];
      if (currentTab) {
        setIndicatorStyle({
          left: currentTab.offsetLeft,
          width: currentTab.offsetWidth,
        });
      }
    }
  }, [selectedIndex, tabs]);

  const TabGroupElement = (
    <div
      className={twMerge(
        "w-full",
        className,
        disabled ? "cursor-not-allowed opacity-60" : "",
      )}
    >
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
        <Tab.List className="glass relative inline-flex min-w-fit overflow-x-auto rounded-lg p-0.5 py-1">
          {/* Animated indicator */}
          <div
            className="absolute top-1 z-10 h-[calc(100%-8px)] rounded-md bg-brand-primary/30 transition-all duration-200 ease-in-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />

          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              ref={(el) => (tabsRef.current[index] = el)}
              disabled={disabled}
              className={({ selected }) =>
                twMerge(
                  "relative z-20 mx-0.5 min-w-max rounded-md border-2 border-transparent px-4 py-0.5 text-center text-sm font-semibold transition-all duration-200 ease-in-out",
                  selected ? "text-white" : "text-gray-300 hover:text-white",
                  disabled ? "cursor-not-allowed opacity-60" : "",
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
    </div>
  );

  return (
    <>
      {disabled && (
        <Tooltip
          content={
            disabledMessage ?? "Cannot change tab. Generation in progress."
          }
          position="bottom"
        >
          {TabGroupElement}
        </Tooltip>
      )}
      {!disabled && TabGroupElement}
    </>
  );
};
