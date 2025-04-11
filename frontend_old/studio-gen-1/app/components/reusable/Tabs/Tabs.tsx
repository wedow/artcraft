import { useState } from "react";
import { Tab } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

export type TabType = {
  header: string;
  children: JSX.Element;
};

export const Tabs = ({ tabs: tabProps }: { tabs: TabType[] }) => {
  const [tabs] = useState(tabProps);

  const tabHeaderClassName = (selected: boolean) =>
    twMerge(
      "px-4 py-4 text-md font-medium leading-5 focus:outline-none transition duration-150 ease-in-out border-b-[3px] border-white/[.1]",
      selected
        ? "text-white border-brand-primary"
        : "text-white/[0.5] hover:text-white hover:border-white/[.3]",
    );

  return (
    <div className="flex h-full w-full flex-col px-2 sm:px-0">
      <Tab.Group defaultIndex={3}>
        <Tab.List className="flex">
          {tabs.map((tab, idx) => (
            <Tab
              key={idx}
              className={({ selected }) => tabHeaderClassName(selected)}
            >
              {tab.header}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="grow overflow-auto p-4">
          {tabs.map((tab, idx) => (
            <Tab.Panel key={idx}>{tab.children}</Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
