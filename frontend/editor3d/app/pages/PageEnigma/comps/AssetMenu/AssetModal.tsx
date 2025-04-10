import { TransitionDialogue } from "~/components/reusable/TransitionDialogue";
import {
  faPlus,
  faSearch,
  faChevronLeft,
  faLayerGroup,
  faUser,
  faSun,
  faTree,
  faCube,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, CloseButton, Input, Tooltip } from "~/components";
import { TabSelector } from "~/components/reusable/TabSelector";
import { useState, useEffect, useMemo, useRef } from "react";
import { ItemElements } from "../SidePanelTabs/sharedComps/ItemElements";
import {
  demoSkyboxItems,
  demoShapeItems,
  demoCharacterItems,
  assetModalVisibleDuringDrag,
  reopenAfterDragSignal,
} from "../../signals";
import { MediaItem } from "../../models";
import { useUserObjects, useFeaturedObjects } from "../SidePanelTabs/hooks";
import { FilterEngineCategories } from "~/enums";
import { twMerge } from "tailwind-merge";
import { useSignals } from "@preact/signals-react/runtime";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AssetTab = {
  id: string;
  label: string;
  icon: typeof faLayerGroup;
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
  <div className="mb-0">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-md ml-2 font-semibold opacity-90">{label}</h3>
      <Button
        variant="secondary"
        className="mr-3 flex items-center gap-1 px-2 py-1 text-xs"
        onClick={onViewAll}
      >
        View all
        <FontAwesomeIcon icon={faChevronRight} className="text-xs opacity-70" />
      </Button>
    </div>
    <div className="h-[170px]">
      <ItemElements
        items={items.slice(0, 4)}
        busy={false}
        debug={`all-tab-section-${label}`}
      />
    </div>
  </div>
);

export const AssetModal = ({ isOpen, onClose }: AssetModalProps) => {
  useSignals();
  const [activeLibraryTab, setActiveLibraryTab] = useState("library");
  const [activeAssetTab, setActiveAssetTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reopenAfterAdd, setReopenAfterAdd] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update the signal when the preference changes
  useEffect(() => {
    reopenAfterDragSignal.value = reopenAfterAdd;
  }, [reopenAfterAdd]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal is fully mounted
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const assetTabs: AssetTab[] = [
    { id: "all", label: "All", icon: faLayerGroup, items: [] },
    {
      id: "character",
      label: "Character",
      icon: faUser,
      engineCategory: FilterEngineCategories.CHARACTER,
      items:
        activeLibraryTab === "library"
          ? [...demoCharacterItems.value, ...(featuredCharacters ?? [])]
          : (userCharacters ?? []),
    },
    {
      id: "objects",
      label: "Objects",
      icon: faCube,
      engineCategory: FilterEngineCategories.OBJECT,
      items:
        activeLibraryTab === "library"
          ? [...demoShapeItems.value, ...(featuredObjects ?? [])]
          : (userObjects ?? []),
    },
    {
      id: "skybox",
      label: "Skybox",
      icon: faSun,
      items: demoSkyboxItems.value,
    },
    {
      id: "nature",
      label: "Nature",
      icon: faTree,
      engineCategory: FilterEngineCategories.SET_DRESSING,
      items:
        activeLibraryTab === "library"
          ? (featuredNature ?? [])
          : (userNature ?? []),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Clear search term when tab changes
  useEffect(() => {
    setSearchTerm("");
  }, [activeAssetTab]);

  const renderContent = () => {
    if (activeAssetTab === "all" && !searchTerm) {
      return (
        <div className="h-full space-y-2 overflow-y-auto">
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

  const handleAddAsset = () => {
    if (reopenAfterAdd) {
      // Small delay to allow the modal to close and reopen
      setTimeout(() => {
        onClose();
      }, 100);
    } else {
      onClose();
    }
  };

  const clearSearch = () => setSearchTerm("");

  return (
    <TransitionDialogue
      isOpen={isOpen && assetModalVisibleDuringDrag.value}
      onClose={onClose}
      className="h-[640px] max-w-4xl"
      childPadding={false}
    >
      <div className="grid h-full grid-cols-12 gap-3">
        <div className="relative col-span-3 flex h-full flex-col p-3 pt-2 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 after:dark:bg-white/10">
          <div className="flex items-center justify-between gap-2.5 py-0.5">
            <h2 className="text-[18px] font-semibold opacity-80">3D Assets</h2>
            <Tooltip content="Upload model" position="top" delay={200}>
              <Button
                className="h-6 w-6 rounded-full border-none bg-transparent text-white/70 transition-colors hover:bg-transparent hover:text-white/100"
                onClick={handleAddAsset}
              >
                <FontAwesomeIcon icon={faPlus} className="text-xl" />
              </Button>
            </Tooltip>
          </div>
          <hr className="my-2 w-full border-white/10" />
          <div className="space-y-2">
            {assetTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeAssetTab === tab.id ? "primary" : "secondary"}
                className={twMerge(
                  "w-full justify-start rounded-xl border border-white/[2%] bg-white/[4%] px-3.5 py-2.5 text-left hover:bg-white/15",
                  activeAssetTab === tab.id &&
                    "border-brand-primary bg-brand-primary/10 hover:bg-brand-primary/10",
                )}
                onClick={() => setActiveAssetTab(tab.id)}
              >
                <FontAwesomeIcon icon={tab.icon} className="mr-2 opacity-70" />
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2 pt-3">
            <input
              type="checkbox"
              id="reopen-after-add"
              checked={reopenAfterAdd}
              onChange={(e) => setReopenAfterAdd(e.target.checked)}
              className="h-4 w-4 rounded-lg border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="reopen-after-add" className="text-sm text-white/70">
              Reopen after adding
            </label>
          </div>
        </div>
        <div className="col-span-9 p-3 pb-0 ps-0 pt-2">
          <div className="flex h-full flex-col">
            <div className="h-full">
              <div className="flex items-center gap-4">
                <TabSelector
                  tabs={libraryTabs}
                  activeTab={activeLibraryTab}
                  onTabChange={setActiveLibraryTab}
                  className="w-auto"
                />
                <div className="relative grow">
                  <Input
                    ref={searchInputRef}
                    placeholder="Search"
                    className="grow"
                    inputClassName="pr-2.5"
                    icon={faSearch}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    iconClassName="text-white/60"
                  />
                  {searchTerm && (
                    <CloseButton
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 bg-white/10 text-[10px] hover:bg-white/20"
                    />
                  )}
                </div>
                <CloseButton onClick={onClose} />
              </div>
              <div
                className={twMerge(
                  "overflow-auto-y mt-4 h-[574px]",
                  activeAssetTab !== "all" && "h-[552px]",
                )}
              >
                {activeAssetTab !== "all" && !searchTerm && (
                  <div className="mb-2 flex items-center font-semibold">
                    <Button
                      variant="secondary"
                      className="flex items-center gap-2 border-none bg-transparent px-3 py-1.5 text-sm text-white/70 hover:bg-transparent hover:text-white/100"
                      onClick={() => setActiveAssetTab("all")}
                    >
                      <FontAwesomeIcon
                        icon={faChevronLeft}
                        className="text-sm font-semibold opacity-70"
                      />
                    </Button>
                    {currentTab.label}
                  </div>
                )}
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TransitionDialogue>
  );
};
