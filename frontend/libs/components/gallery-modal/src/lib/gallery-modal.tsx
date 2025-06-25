import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { CloseButton } from "@storyteller/ui-close-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  FilterMediaClasses,
  FilterMediaType,
  GalleryModalApi,
  UsersApi,
} from "@storyteller/api";
import { twMerge } from "tailwind-merge";
import { GalleryDraggableItem } from "./GalleryDraggableItem";
import { useSignals } from "@preact/signals-react/runtime";
import { useGalleryModalStore } from "./galleryModalStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faBorderAll,
  faImage,
  faVideo,
  faCube,
  faUpload,
  faExpand,
  faCompress,
  faArrowsRotate,
  faUser,
  faSun,
  faMountainCity,
  faDog,
  faUpFromLine,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import { PopoverMenu } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { Tooltip } from "@storyteller/ui-tooltip";
import { UploadModal3D } from "@storyteller/ui-upload-modal-3d";
import {
  MediaFilesApi,
  FilterEngineCategories,
  MediaFile,
} from "@storyteller/api";
import { Switch } from "@storyteller/ui-switch";
import { GalleryItem } from "./types";
import { demoCharacters, demoShapes } from "./demoData";

interface GroupedItems {
  [date: string]: GalleryItem[];
}

interface Grouped3DItems {
  [categoryName: string]: GalleryItem[];
}

type ModalMode = "select" | "view";

interface GalleryModalProps {
  onClose?: () => void;
  mode: ModalMode;
  selectedItemIds?: string[];
  onSelectItem?: (id: string) => void;
  maxSelections?: number;
  onUseSelected?: (selectedItems: GalleryItem[]) => void;
  onDownloadClicked?: (url: string, mediaClass?: string) => Promise<void>;
  onAddToSceneClicked?: (
    url: string,
    media_id: string | undefined
  ) => Promise<void>;
  isOpen?: boolean;
  forceFilter?: string;
}

export const GalleryModal = React.memo(
  ({
    onClose,
    mode = "view",
    selectedItemIds = [],
    onSelectItem,
    maxSelections = 4,
    onUseSelected,
    onDownloadClicked,
    onAddToSceneClicked,
    isOpen,
    forceFilter,
  }: GalleryModalProps) => {
    const [loading, setLoading] = useState(false);
    const [failedImageUrls] = useState<Set<string>>(new Set());
    const [username, setUsername] = useState<string>("");
    const { initialFilter } = useGalleryModalStore();

    const [activeFilter, setActiveFilter] = useState(
      initialFilter || forceFilter || "all"
    );
    const [active3DCategory, setActive3DCategory] = useState("all");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] =
      useState<FilterEngineCategories | null>(null);
    const [isSelectVisible, setIsSelectVisible] = useState(true);
    const [showArtCraftOnly, setShowArtCraftOnly] = useState(false);

    const {
      visibleDuringDrag,
      reopenAfterDrag,
      setReopenAfterDrag,
      openLightbox,
    } = useGalleryModalStore();

    const [featuredItems, setFeaturedItems] = useState<GalleryItem[]>([]);
    const [grouped3dItems, setGrouped3dItems] = useState<Grouped3DItems>({});

    const requestCounter = useRef(0);

    const cache = useRef<{
      user: { [category: string]: GalleryItem[] };
      featured: { [category: string]: GalleryItem[] };
      userPagination: {
        [category: string]: { pageIndex: number; hasMore: boolean };
      };
    }>({ user: {}, featured: {}, userPagination: {} }).current;

    useEffect(() => {
      if (initialFilter) {
        setActiveFilter(initialFilter);
      } else if (forceFilter) {
        setActiveFilter(forceFilter);
      }
    }, [initialFilter, forceFilter]);

    const minColumns = 3;
    const maxColumns = 12;
    // Default gridColumns to 5
    const defaultGridColumns = 5;
    const [sliderValue, setSliderValue] = useState(
      maxColumns - (defaultGridColumns - minColumns)
    );
    const gridColumns = maxColumns - (sliderValue - minColumns);
    const [imageFit, setImageFit] = useState<"cover" | "contain">("contain");
    const [allItems, setAllItems] = useState<GalleryItem[]>([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 25;

    const api = useMemo(() => new GalleryModalApi(), []);
    const mediaFilesApi = useMemo(() => new MediaFilesApi(), []);
    const usersApi = useMemo(() => new UsersApi(), []);

    const formatDate = useCallback((date: string) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }, []);

    const groupItemsByDate = useCallback(
      (items: GalleryItem[]) => {
        const grouped = items.reduce((acc: GroupedItems, item) => {
          const dateKey = formatDate(item.createdAt);
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(item);
          return acc;
        }, {});

        // Sort dates in descending order
        return Object.fromEntries(
          Object.entries(grouped).sort(
            (a, b) =>
              new Date(b[1][0].createdAt).getTime() -
              new Date(a[1][0].createdAt).getTime()
          )
        );
      },
      [formatDate]
    );

    const handleImageError = useCallback(
      (url: string) => {
        failedImageUrls.add(url);
      },
      [failedImageUrls]
    );

    useEffect(() => {
      const getUsername = async () => {
        const session = await usersApi.GetSession();
        if (session.success && session.data?.user) {
          setUsername(session.data.user.username);
        }
      };
      if (typeof isOpen === "boolean" ? isOpen : true) {
        getUsername();
      }
    }, [usersApi, isOpen]);

    // filter state
    const FILTERS = [
      { id: "all", label: "All", icon: <FontAwesomeIcon icon={faBorderAll} /> },
      { id: "image", label: "Image", icon: <FontAwesomeIcon icon={faImage} /> },
      { id: "video", label: "Video", icon: <FontAwesomeIcon icon={faVideo} /> },
      { id: "3d", label: "3D Object", icon: <FontAwesomeIcon icon={faCube} /> },
      {
        id: "uploaded",
        label: "Uploaded",
        icon: <FontAwesomeIcon icon={faUpload} />,
      },
    ];

    // Map filter to API/media class
    const getFilterMediaClass = (filter: string) => {
      switch (filter) {
        case "image":
          return [FilterMediaClasses.IMAGE];
        case "video":
          return [FilterMediaClasses.VIDEO];
        case "3d":
          return [FilterMediaClasses.DIMENSIONAL];
        case "uploaded":
          return [
            FilterMediaClasses.IMAGE,
            FilterMediaClasses.VIDEO,
            FilterMediaClasses.DIMENSIONAL,
          ];
        default:
          return undefined;
      }
    };

    const asset3DCategories = useMemo(
      () => [
        { id: "all", label: "All", icon: faBorderAll },
        {
          id: "character",
          label: "Characters",
          icon: faUser,
          engineCategory: FilterEngineCategories.CHARACTER,
        },
        {
          id: "objects",
          label: "Objects",
          icon: faCube,
          engineCategory: FilterEngineCategories.OBJECT,
        },
        {
          id: "sets",
          label: "Sets",
          icon: faMountainCity,
          engineCategory: FilterEngineCategories.LOCATION,
        },
        {
          id: "creatures",
          label: "Creatures",
          icon: faDog,
          engineCategory: FilterEngineCategories.CREATURE,
        },
        {
          id: "skybox",
          label: "Skybox",
          icon: faSun,
          engineCategory: FilterEngineCategories.SKYBOX,
        },
      ],
      []
    );

    const loadItems = async (reset = false) => {
      const currentRequest = ++requestCounter.current;
      if (!username) return;

      setLoading(true);

      if (activeFilter === "3d") {
        const categoryId = active3DCategory;
        const isAllTab = categoryId === "all";

        if (reset) {
          setAllItems([]);
          setPageIndex(0);
          setHasMore(true);
          if (isAllTab) {
            setGrouped3dItems({});
          }
        }

        const category = asset3DCategories.find((c) => c.id === categoryId);

        // Step 1: Fetch featured items
        let featured: GalleryItem[] = [];
        if (reset) {
          if (isAllTab) {
            const categoriesToFetch = asset3DCategories.filter(
              (c) => c.id !== "all" && c.engineCategory
            );

            const promises = categoriesToFetch.map(async (cat) => {
              const response = await mediaFilesApi.ListFeaturedMediaFiles({
                filter_engine_categories: [cat.engineCategory!],
                filter_media_classes: [FilterMediaClasses.DIMENSIONAL],
                page_size: 4,
              });
              return {
                category: cat.label,
                items:
                  response.success && response.data
                    ? response.data
                        .filter(
                          (item) => !item.media_links.cdn_url?.endsWith(".pmx")
                        )
                        .map((item) => mapToGalleryItem(item, true))
                    : [],
              };
            });

            const results = await Promise.all(promises);

            if (currentRequest === requestCounter.current) {
              const newGroupedItems: Grouped3DItems = {};
              results.forEach((result) => {
                if (result.items.length > 0) {
                  newGroupedItems[result.category] = result.items;
                }
              });

              // Special handling for demo items
              newGroupedItems["Characters"] = [
                ...demoCharacters,
                ...(newGroupedItems["Characters"] || []),
              ].slice(0, 4);
              newGroupedItems["Objects"] = [
                ...demoShapes,
                ...(newGroupedItems["Objects"] || []),
              ].slice(0, 4);

              setGrouped3dItems(newGroupedItems);
            }
            // For the "All" tab, we still need to proceed to fetch user items below.
          } else {
            const featuredResponse = await mediaFilesApi.ListFeaturedMediaFiles(
              {
                filter_engine_categories: category?.engineCategory
                  ? [category.engineCategory]
                  : undefined,
                filter_media_classes: [FilterMediaClasses.DIMENSIONAL],
              }
            );
            if (
              currentRequest === requestCounter.current &&
              featuredResponse.success &&
              featuredResponse.data
            ) {
              featured = featuredResponse.data
                .filter((item) => !item.media_links.cdn_url?.endsWith(".pmx"))
                .map((item) => mapToGalleryItem(item, true));
            }
          }
          if (!isAllTab) setFeaturedItems(featured);
        } else {
          featured = featuredItems;
        }

        // Step 2: Fetch user items (paginated)
        const userResponse = showArtCraftOnly
          ? { success: false, data: [], pagination: undefined }
          : await mediaFilesApi.ListUserMediaFiles({
              username,
              include_user_uploads: true,
              filter_engine_categories:
                !isAllTab && category?.engineCategory
                  ? [category.engineCategory]
                  : undefined,
              filter_media_classes: [FilterMediaClasses.DIMENSIONAL],
              page_index: reset ? 0 : pageIndex,
              page_size: pageSize,
            });

        if (currentRequest !== requestCounter.current) return setLoading(false);

        let user: GalleryItem[] = [];
        if (userResponse.success && userResponse.data) {
          user = userResponse.data
            .filter((item) => !item.media_links.cdn_url?.endsWith(".pmx"))
            .map((item) => mapToGalleryItem(item, false));
        }

        // Step 3: Combine, sort, and set state
        setAllItems((prev) => {
          if (isAllTab) {
            // For 'All' tab, allItems is only user items.
            return reset ? user : [...prev, ...user];
          }

          // For specific category tabs:
          let initialItems: GalleryItem[] = [];
          if (reset) {
            if (categoryId === "character")
              initialItems.push(...demoCharacters);
            if (categoryId === "objects") initialItems.push(...demoShapes);
            initialItems.push(...featured);
          }

          const combined = reset
            ? [...initialItems, ...user]
            : [...prev, ...user];

          // De-duplicate
          const seen = new Set();
          return combined.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        });

        const pagination = (userResponse as any).pagination;
        setPageIndex((pagination?.current ?? 0) + 1);
        setHasMore(
          !showArtCraftOnly &&
            (pagination?.current ?? 0) + 1 < (pagination?.total_page_count ?? 1)
        );
        setLoading(false);
        return;
      }

      try {
        let response = null;
        const filterMediaClasses = getFilterMediaClass(activeFilter);
        const query = {
          filter_media_classes: filterMediaClasses,
          username: username,
          include_user_uploads:
            activeFilter === "uploaded" ||
            activeFilter === "all" ||
            activeFilter === "3d" ||
            activeFilter === "image",
          user_uploads_only: activeFilter === "uploaded",
          page_index: reset ? 0 : pageIndex,
          page_size: pageSize,
        };
        response = await api.listUserMediaFiles(query);

        if (response.success && response.data) {
          const thumbnail_size = 250;
          const newItems = response.data
            .filter(
              (item: any) =>
                item.media_type !== FilterMediaType.SCENE_JSON &&
                !item.media_links.cdn_url?.endsWith(".pmx")
            )
            .map((item: any) => ({
              id: item.token,
              label: item.maybe_title || "Image Generation",
              thumbnail:
                item.media_class === "video"
                  ? item.media_links.maybe_video_previews.still
                  : item.media_class === "dimensional"
                  ? (item.cover_image as any)
                      ?.maybe_cover_image_public_bucket_url ||
                    item.cover_image?.maybe_cover_image_public_bucket_path ||
                    item.media_links.maybe_thumbnail_template?.replace(
                      "{WIDTH}",
                      thumbnail_size.toString()
                    )
                  : item.media_links.maybe_thumbnail_template?.replace(
                      "{WIDTH}",
                      thumbnail_size.toString()
                    ),
              fullImage: item.media_links.cdn_url,
              createdAt: item.created_at,
              mediaClass:
                item.media_class ||
                (item.filter_media_classes
                  ? item.filter_media_classes[0]
                  : "image"),
            }));
          setAllItems((prev) => {
            if (reset) return newItems;
            const existingIds = new Set(prev.map((i) => i.id));
            const deduped = newItems.filter((i) => !existingIds.has(i.id));
            return [...prev, ...deduped];
          });
          // Pagination logic
          const current = response.pagination?.current ?? 0;
          const total = response.pagination?.total_page_count ?? 1;
          setPageIndex(current + 1);
          if (showArtCraftOnly) {
            setHasMore(false);
          } else {
            setHasMore(current + 1 < total);
          }
        }
      } catch (error) {
        console.error("Failed to fetch library items:", error);
      }
      setLoading(false);
    };

    // Helper function to be defined inside the component
    const mapToGalleryItem = (
      item: MediaFile,
      isFeatured: boolean
    ): GalleryItem => ({
      id: item.token,
      label: item.maybe_title || "3D Asset",
      thumbnail:
        (item.cover_image as any)?.maybe_cover_image_public_bucket_url ||
        item.cover_image?.maybe_cover_image_public_bucket_path ||
        item.media_links.thumbnail_template?.replace("{WIDTH}", "250"),
      fullImage: item.media_links.cdn_url,
      createdAt: item.created_at,
      mediaClass: "dimensional",
      engineCategory: item.origin_category as FilterEngineCategories,
      name: item.maybe_title ?? undefined,
      assetType: "object",
      isFeatured,
    });

    // refresh logic
    const refreshGallery = useCallback(() => {
      cache.user = {};
      cache.featured = {};
      cache.userPagination = {};
      setAllItems([]);
      setGrouped3dItems({});
      setPageIndex(0);
      setHasMore(true);
      loadItems(true);
    }, [loadItems]);

    useEffect(() => {
      // Refresh every time the modal is opened
      const modalIsOpen = typeof isOpen === "boolean" ? isOpen : true;
      if (modalIsOpen && username) {
        refreshGallery();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, isOpen, username, activeFilter]);

    useEffect(() => {
      // Refresh when active 3D category changes
      if (activeFilter === "3d") {
        refreshGallery();
      }
    }, [active3DCategory]);

    useEffect(() => {
      if (activeFilter === "3d") {
        refreshGallery();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showArtCraftOnly]);

    const handleItemClick = useCallback(
      (item: GalleryItem) => {
        if (mode === "select" && onSelectItem) {
          onSelectItem(item.id);
        } else {
          openLightbox(item);
        }
      },
      [mode, onSelectItem, openLightbox]
    );

    const handleDeselectAll = useCallback(() => {
      selectedItemIds.forEach((id: any) => onSelectItem?.(id));
    }, [selectedItemIds, onSelectItem]);

    const handleUseSelected = useCallback(() => {
      const selectedItems = Object.values(groupItemsByDate(allItems))
        .flat()
        .filter((item) => selectedItemIds.includes(item.id));
      onUseSelected?.(selectedItems);
    }, [groupItemsByDate, selectedItemIds, onUseSelected]);

    useSignals();

    // Compute gap class based on gridColumns
    let gapClass = "gap-0.5";
    if (gridColumns <= 4) gapClass = "gap-1.5";
    else if (gridColumns <= 7) gapClass = "gap-1";

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (
        scrollHeight - scrollTop - clientHeight < 100 &&
        hasMore &&
        !loading
      ) {
        loadItems();
      }
    };

    const handleAddAsset = () => {
      setIsUploadModalOpen(true);
      setSelectedCategory(null);
      setIsSelectVisible(true);
    };

    const handleUploadSuccess = (category: FilterEngineCategories) => {
      setIsUploadModalOpen(false);
      // Optional: set the category filter to the newly uploaded type
      const categoryId = asset3DCategories.find(
        (c) => c.engineCategory === category
      )?.id;
      if (categoryId) {
        setActive3DCategory(categoryId);
      } else {
        setActive3DCategory("all");
      }
      refreshGallery();
    };

    return (
      <>
        <Modal
          resizable={mode === "view"}
          isOpen={
            mode === "view"
              ? (typeof isOpen === "boolean" ? isOpen : true) &&
                visibleDuringDrag
              : typeof isOpen === "boolean"
              ? isOpen
              : true
          }
          onClose={() => {
            onClose?.();
          }}
          className={twMerge(
            "h-[620px] max-w-4xl",
            mode === "view" &&
              "h-[640px] min-h-[640px] min-w-[56rem] w-[56rem] max-w-none"
          )}
          childPadding={false}
          showClose={false}
          draggable={mode === "view"}
          allowBackgroundInteraction={mode === "view" ? true : false}
          closeOnOutsideClick={mode === "view" ? false : true}
        >
          {mode === "view" && (
            <Modal.DragHandle>
              <div className="absolute left-0 top-0 z-[50] h-[60px] w-full cursor-move" />
            </Modal.DragHandle>
          )}
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 p-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    {mode === "select" ? "Select Images" : "My Library"}
                  </h2>
                  {mode === "view" && (
                    <div className="flex items-center relative z-[51]">
                      <input
                        type="checkbox"
                        id="gallery-reopen-after-drag"
                        checked={reopenAfterDrag}
                        onChange={(e) => setReopenAfterDrag(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded-lg border-gray-300 bg-gray-700 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="gallery-reopen-after-drag"
                        className="ml-2 cursor-pointer select-none text-sm text-white/70"
                      >
                        Reopen after adding
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 items-center">
                  {activeFilter === "3d" && (
                    <Tooltip position="top" content="Upload 3D Asset">
                      <Button
                        variant="action"
                        onClick={handleAddAsset}
                        className="relative z-[51] h-9 w-9 bg-primary/80 hover:bg-primary"
                      >
                        <FontAwesomeIcon
                          icon={faUpFromLine}
                          className="text-lg text-white"
                        />
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip
                    position="top"
                    content="Refresh list"
                    closeOnClick={true}
                  >
                    <Button
                      variant="action"
                      onClick={refreshGallery}
                      className="relative z-[51] h-9 w-9 bg-[#5F5F68]/60 hover:bg-[#5F5F68]/90"
                      disabled={loading}
                      aria-label="Refresh list"
                    >
                      <FontAwesomeIcon
                        icon={faArrowsRotate}
                        className="text-lg text-white"
                      />
                    </Button>
                  </Tooltip>
                  <Tooltip
                    position="top"
                    content="Toggle image fit"
                    closeOnClick={true}
                  >
                    <Button
                      variant="action"
                      onClick={() =>
                        setImageFit((fit) =>
                          fit === "cover" ? "contain" : "cover"
                        )
                      }
                      className="relative z-[51] h-9 w-9 bg-[#5F5F68]/60 hover:bg-[#5F5F68]/90"
                    >
                      <FontAwesomeIcon
                        icon={imageFit === "cover" ? faExpand : faCompress}
                        className="text-lg text-white"
                      />
                    </Button>
                  </Tooltip>

                  <div className="w-48 mx-3 relative z-[51] flex items-center gap-2">
                    <SliderV2
                      min={minColumns}
                      max={maxColumns}
                      value={sliderValue}
                      onChange={setSliderValue}
                      step={1}
                      variant="classic"
                      showTooltip={false}
                      className="w-full"
                      showProgressBar={false}
                      tooltipContent={`${
                        maxColumns - (sliderValue - minColumns)
                      } columns`}
                    />
                  </div>
                  <Tooltip
                    position="top"
                    content={forceFilter ? "Filter locked" : "Filter"}
                    closeOnClick={true}
                  >
                    <PopoverMenu
                      panelTitle="Filter"
                      position="bottom"
                      align="end"
                      buttonClassName={`relative z-[51] mr-3 ${
                        forceFilter ? "opacity-70 pointer-events-none" : ""
                      }`}
                      panelClassName="min-w-36"
                      items={FILTERS.map((f) => ({
                        label: f.label,
                        selected: activeFilter === f.id,
                        icon: f.icon,
                        customProps: {
                          disabled: forceFilter !== undefined,
                        },
                      }))}
                      onSelect={(item) => {
                        if (!forceFilter) {
                          const filter = FILTERS.find(
                            (f) => f.label === item.label
                          );
                          if (filter) setActiveFilter(filter.id);
                        }
                      }}
                      triggerIcon={<FontAwesomeIcon icon={faFilter} />}
                      triggerLabel={
                        FILTERS.find((f) => f.id === activeFilter)?.label
                      }
                      mode="toggle"
                      showIconsInList={true}
                    />
                  </Tooltip>
                  {mode === "view" && <Modal.ExpandButton />}
                  <CloseButton
                    onClick={() => {
                      onClose?.();
                    }}
                    className="relative z-[51]"
                  />
                </div>
              </div>
            </div>

            {activeFilter === "3d" && (
              <div className="px-4 py-2.5 flex items-center gap-2 border-white/10">
                {asset3DCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={
                      active3DCategory === cat.id ? "primary" : "secondary"
                    }
                    onClick={() => setActive3DCategory(cat.id)}
                    className="px-3 py-1.5 text-xs"
                  >
                    <FontAwesomeIcon icon={cat.icon} />
                    {cat.label}
                  </Button>
                ))}
                <div className="ml-auto flex items-center">
                  <Tooltip content="ArtCraft assets only" position="top">
                    <Switch
                      enabled={showArtCraftOnly}
                      setEnabled={(v) => setShowArtCraftOnly(v)}
                    />
                  </Tooltip>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
              {loading &&
              allItems.length === 0 &&
              !Object.keys(grouped3dItems).length ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-white/60">
                    <LoadingSpinner className="h-12 w-12" />
                  </div>
                </div>
              ) : activeFilter === "3d" && active3DCategory === "all" ? (
                <div className="space-y-6 p-4">
                  {Object.entries(grouped3dItems).map(
                    ([categoryName, items]) => (
                      <div key={categoryName}>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-semibold text-lg">
                            {categoryName}
                          </h3>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const catId = asset3DCategories.find(
                                (c) => c.label === categoryName
                              )?.id;
                              if (catId) setActive3DCategory(catId);
                            }}
                            className="text-sm text-white/60 hover:text-white bg-transparent hover:bg-white/10"
                          >
                            View all{" "}
                            <FontAwesomeIcon
                              icon={faChevronRight}
                              className="ml-2"
                            />
                          </Button>
                        </div>
                        <div
                          className={twMerge("grid", gapClass)}
                          style={{
                            gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                          }}
                        >
                          {items.map((item) => (
                            <GalleryDraggableItem
                              key={item.id}
                              item={item}
                              mode={mode}
                              activeFilter={activeFilter}
                              selected={selectedItemIds.includes(item.id)}
                              onClick={() => handleItemClick(item)}
                              onImageError={() =>
                                handleImageError(item.thumbnail!)
                              }
                              disableTooltipAndBadge={mode === "select"}
                              imageFit={imageFit}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* User's Library Section */}
                  {allItems.length > 0 && (
                    <div>
                      <div className="mb-2 mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                        <h3 className="font-semibold text-lg">Your Library</h3>
                      </div>
                      <div
                        className={twMerge("grid", gapClass)}
                        style={{
                          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                        }}
                      >
                        {allItems.map((item) => (
                          <GalleryDraggableItem
                            key={item.id}
                            item={item}
                            mode={mode}
                            activeFilter={activeFilter}
                            selected={selectedItemIds.includes(item.id)}
                            onClick={() => handleItemClick(item)}
                            onImageError={() =>
                              handleImageError(item.thumbnail!)
                            }
                            disableTooltipAndBadge={mode === "select"}
                            imageFit={imageFit}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {loading && allItems.length > 0 && (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner className="h-8 w-8" />
                    </div>
                  )}
                  {!hasMore && allItems.length > 0 && (
                    <div className="flex justify-center py-4 text-white/40 text-xs">
                      No more items
                    </div>
                  )}
                </div>
              ) : activeFilter === "3d" && active3DCategory !== "all" ? (
                <div className="space-y-6 p-4">
                  <div className="mb-2 flex items-center justify-between font-semibold">
                    <Button
                      variant="secondary"
                      onClick={() => setActive3DCategory("all")}
                    >
                      Back
                    </Button>
                    <h3>
                      {
                        asset3DCategories.find((c) => c.id === active3DCategory)
                          ?.label
                      }
                    </h3>
                  </div>
                  <div
                    className={twMerge("grid", gapClass)}
                    style={{
                      gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                    }}
                  >
                    {allItems.map((item) => (
                      <GalleryDraggableItem
                        key={item.id}
                        item={item}
                        mode={mode}
                        activeFilter={activeFilter}
                        selected={selectedItemIds.includes(item.id)}
                        onClick={() => handleItemClick(item)}
                        onImageError={() => handleImageError(item.thumbnail!)}
                        disableTooltipAndBadge={mode === "select"}
                        imageFit={imageFit}
                      />
                    ))}
                  </div>
                  {loading && allItems.length > 0 && (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner className="h-8 w-8" />
                    </div>
                  )}
                  {!hasMore && allItems.length > 0 && (
                    <div className="flex justify-center py-4 text-white/40 text-xs">
                      No more items
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 p-4">
                  <div
                    className={twMerge("grid", gapClass)}
                    style={{
                      gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                    }}
                  >
                    {allItems.map((item) => (
                      <GalleryDraggableItem
                        key={item.id}
                        item={item}
                        mode={mode}
                        activeFilter={activeFilter}
                        selected={selectedItemIds.includes(item.id)}
                        onClick={() => handleItemClick(item)}
                        onImageError={() => handleImageError(item.thumbnail!)}
                        disableTooltipAndBadge={mode === "select"}
                        imageFit={imageFit}
                      />
                    ))}
                  </div>
                  {loading && allItems.length > 0 && (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner className="h-8 w-8" />
                    </div>
                  )}
                  {!hasMore && allItems.length > 0 && (
                    <div className="flex justify-center py-4 text-white/40 text-xs">
                      No more items
                    </div>
                  )}
                </div>
              )}
            </div>

            {mode === "select" && (
              <div className="flex items-center justify-between border-t border-white/10 bg-black/25 p-4">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-white/80">
                    {selectedItemIds.length}/{maxSelections} selected
                  </div>
                  {selectedItemIds.length > 0 && (
                    <span className="text-white/10">|</span>
                  )}
                  {selectedItemIds.length > 0 && (
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-white/60 hover:text-white"
                    >
                      Deselect All
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleUseSelected}
                  disabled={selectedItemIds.length === 0}
                >
                  Use selected
                </Button>
              </div>
            )}
          </div>
        </Modal>

        <UploadModal3D
          onClose={() => {
            setIsUploadModalOpen(false);
          }}
          onSuccess={(category: FilterEngineCategories) =>
            handleUploadSuccess(category)
          }
          isOpen={isUploadModalOpen}
          title={`Upload 3D Asset`}
          titleIcon={faUpFromLine}
          preselectedCategory={
            selectedCategory || FilterEngineCategories.OBJECT
          }
          isSelectVisible={isSelectVisible}
        />
      </>
    );
  }
);

GalleryModal.displayName = "GalleryModal";

export default GalleryModal;
