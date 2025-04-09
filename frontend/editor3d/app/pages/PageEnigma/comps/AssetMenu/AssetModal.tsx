import { TransitionDialogue } from "~/components/reusable/TransitionDialogue";
import {
  faPlus,
  faSearch,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, CloseButton, Input, Tooltip } from "~/components";
import { TabSelector } from "~/components/reusable/TabSelector";
import { useState, useEffect, useMemo } from "react";
import { ItemElements } from "../SidePanelTabs/sharedComps/ItemElements";
import { demoSkyboxItems, demoShapeItems } from "../../signals";
import { MediaItem } from "../../models";
import { useUserObjects, useFeaturedObjects } from "../SidePanelTabs/hooks";
import { FilterEngineCategories } from "~/enums";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: () => void;
}

type AssetTab = {
  id: string;
  label: string;
  engineCategory?: FilterEngineCategories;
  items: MediaItem[];
};

const AllTabSection = ({
  label,
  items,
  onViewAll,
}: {
  label: string;
  items: MediaItem[];
  onViewAll: () => void;
}) => (
  <div className="mb-8">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-lg font-medium opacity-90">{label}</h3>
      <Button
        variant="secondary"
        className="flex items-center gap-1 px-2 py-1 text-sm"
        onClick={onViewAll}
      >
        View all
        <FontAwesomeIcon icon={faChevronRight} className="text-xs opacity-70" />
      </Button>
    </div>
    <div className="h-[200px]">
      <ItemElements
        items={items.slice(0, 4)}
        busy={false}
        debug={`all-tab-section-${label}`}
      />
    </div>
  </div>
);

export const AssetModal = ({
  isOpen,
  onClose,
  onAddAsset,
}: AssetModalProps) => {
  const [activeLibraryTab, setActiveLibraryTab] = useState("library");
  const [activeAssetTab, setActiveAssetTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch objects for different categories
  const { userObjects: userCharacters } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.CHARACTER],
    defaultErrorMessage: "Error fetching user characters",
  });

  const { userObjects: userObjects } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.OBJECT],
    defaultErrorMessage: "Error fetching user objects",
  });

  const { userObjects: userNature } = useUserObjects({
    filterEngineCategories: [FilterEngineCategories.SET_DRESSING],
    defaultErrorMessage: "Error fetching user nature assets",
  });

  const { featuredObjects: featuredCharacters } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.CHARACTER],
    defaultErrorMessage: "Error fetching featured characters",
  });

  const { featuredObjects: featuredObjects } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.OBJECT],
    defaultErrorMessage: "Error fetching featured objects",
  });

  const { featuredObjects: featuredNature } = useFeaturedObjects({
    filterEngineCategories: [FilterEngineCategories.SET_DRESSING],
    defaultErrorMessage: "Error fetching featured nature assets",
  });

  const libraryTabs = [
    { id: "library", label: "Library" },
    { id: "mine", label: "Mine" },
  ];

  const assetTabs: AssetTab[] = [
    { id: "all", label: "All", items: [] },
    {
      id: "character",
      label: "Character",
      engineCategory: FilterEngineCategories.CHARACTER,
      items:
        activeLibraryTab === "library"
          ? (featuredCharacters ?? [])
          : (userCharacters ?? []),
    },
    {
      id: "skybox",
      label: "Skybox",
      items: demoSkyboxItems.value,
    },
    {
      id: "nature",
      label: "Nature",
      engineCategory: FilterEngineCategories.SET_DRESSING,
      items:
        activeLibraryTab === "library"
          ? (featuredNature ?? [])
          : (userNature ?? []),
    },
    {
      id: "objects",
      label: "Objects",
      engineCategory: FilterEngineCategories.OBJECT,
      items:
        activeLibraryTab === "library"
          ? [...demoShapeItems.value, ...(featuredObjects ?? [])]
          : (userObjects ?? []),
    },
  ];

  // Combine all items for the "All" tab
  const allItems = useMemo(() => {
    return assetTabs
      .filter((tab) => tab.id !== "all")
      .flatMap((tab) => tab.items);
  }, [assetTabs]);

  // Update the items array for the "All" tab
  assetTabs[0].items = allItems;

  const currentTab =
    assetTabs.find((tab) => tab.id === activeAssetTab) || assetTabs[0];

  // Filter items based on search term
  const displayedItems = useMemo(() => {
    if (!searchTerm) {
      return currentTab.items;
    }

    const searchLower = searchTerm.toLowerCase();
    return currentTab.items.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower),
    );
  }, [currentTab.items, searchTerm]);

  // Switch to "All" tab when searching
  useEffect(() => {
    if (searchTerm && activeAssetTab !== "all") {
      setActiveAssetTab("all");
    }
  }, [searchTerm]);

  const renderContent = () => {
    if (activeAssetTab === "all" && !searchTerm) {
      return (
        <div className="space-y-2">
          {assetTabs.slice(1).map((tab) => (
            <AllTabSection
              key={tab.id}
              label={tab.label}
              items={tab.items}
              onViewAll={() => setActiveAssetTab(tab.id)}
            />
          ))}
        </div>
      );
    }

    return (
      <ItemElements
        items={displayedItems}
        busy={false}
        debug={`asset-modal-${currentTab.id}`}
      />
    );
  };

  return (
    <TransitionDialogue
      isOpen={isOpen}
      onClose={onClose}
      className="h-[640px] max-w-5xl"
      childPadding={false}
    >
      <div className="grid h-full grid-cols-12 gap-3">
        <div className="relative col-span-3 p-3 pt-2 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 after:dark:bg-white/10">
          <div className="flex items-center justify-between gap-2.5 py-0.5">
            <h2 className="text-[18px] font-semibold opacity-80">3D Assets</h2>
            <Tooltip content="Upload model" position="top" delay={200}>
              <Button
                className="h-6 w-6 rounded-full border-none bg-transparent text-white/70 transition-colors hover:bg-transparent hover:text-white/100"
                onClick={onAddAsset}
              >
                <FontAwesomeIcon icon={faPlus} className="text-xl" />
              </Button>
            </Tooltip>
          </div>
          <hr className="my-2 w-full border-white/10" />
          <div className="space-y-1">
            {assetTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeAssetTab === tab.id ? "primary" : "secondary"}
                className="w-full justify-start text-left"
                onClick={() => setActiveAssetTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="col-span-9 p-3 ps-0 pt-2">
          <div className="flex h-full flex-col">
            <div>
              <div className="flex items-center gap-4">
                <TabSelector
                  tabs={libraryTabs}
                  activeTab={activeLibraryTab}
                  onTabChange={setActiveLibraryTab}
                  className="w-auto"
                />
                <Input
                  placeholder="Search"
                  className="grow"
                  icon={faSearch}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CloseButton onClick={onClose} />
              </div>
              <div className="mt-4 h-[480px] overflow-y-auto">
                {renderContent()}
              </div>
            </div>
            <div className="mt-auto flex justify-end pt-4">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        </div>
      </div>
    </TransitionDialogue>
  );
};
