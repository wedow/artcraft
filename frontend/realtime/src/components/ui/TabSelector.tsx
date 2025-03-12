import React, { useRef, useEffect, useState } from "react";
import { Tab, TabGroup, TabList } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

export interface TabItem {
  id: string;
  label: string;
}

interface TabSelectorProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
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

  return (
    <TabGroup
      selectedIndex={selectedIndex}
      onChange={handleTabChange}
      className={twMerge("w-full", className)}
    >
      <TabList className="glass relative inline-flex min-w-fit overflow-x-auto rounded-lg p-1 shadow-lg">
        {/* Animated indicator */}
        <div
          className="absolute top-1 z-10 h-[calc(100%-8px)] rounded-md border-2 border-primary bg-primary/30 transition-all duration-300 ease-in-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />

        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            ref={(el) => (tabsRef.current[index] = el)}
            className={({ selected }) =>
              twMerge(
                "relative z-20 mx-0.5 min-w-max rounded-md border-2 border-transparent px-4 py-1 text-center font-semibold transition-all duration-300 ease-in-out",
                selected ? "text-white" : "text-gray-300 hover:text-white",
              )
            }
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
    </TabGroup>
  );
};
