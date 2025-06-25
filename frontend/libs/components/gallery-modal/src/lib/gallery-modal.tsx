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

export interface GalleryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage?: string | null;
  createdAt: string;
  mediaClass?: string;
  name?: string;
  description?: string;
  engineCategory?: FilterEngineCategories;
}

interface GroupedItems {
  [date: string]: GalleryItem[];
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

    const {
      visibleDuringDrag,
      reopenAfterDrag,
      setReopenAfterDrag,
      openLightbox,
    } = useGalleryModalStore();

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
      if (!username) return;
      setLoading(true);

      if (activeFilter === "3d") {
        try {
          const category = asset3DCategories.find(
            (c) => c.id === active3DCategory
          );
          const filter_engine_categories = category?.engineCategory
            ? [category.engineCategory]
            : undefined;

          const [userFilesResponse, featuredFilesResponse] = await Promise.all([
            mediaFilesApi.ListUserMediaFiles({
              username: username,
              include_user_uploads: true,
              filter_engine_categories,
              filter_media_classes: [FilterMediaClasses.DIMENSIONAL],
              page_index: reset ? 0 : pageIndex,
              page_size: pageSize,
            }),
            mediaFilesApi.ListFeaturedMediaFiles({
              filter_engine_categories,
              filter_media_classes: [FilterMediaClasses.DIMENSIONAL],
            }),
          ]);

          let combinedItems: MediaFile[] = [];
          if (userFilesResponse.success && userFilesResponse.data) {
            combinedItems = combinedItems.concat(userFilesResponse.data);
          }
          if (featuredFilesResponse.success && featuredFilesResponse.data) {
            combinedItems = combinedItems.concat(featuredFilesResponse.data);
          }

          const uniqueItems = Array.from(
            new Map(combinedItems.map((item) => [item.token, item])).values()
          );

          if (uniqueItems.length > 0) {
            const thumbnail_size = 250;
            const newItems = uniqueItems.map((item: MediaFile) => ({
              id: item.token,
              label: item.maybe_title || "3D Asset",
              thumbnail:
                item.cover_image?.maybe_cover_image_public_bucket_path ||
                item.media_links.thumbnail_template?.replace(
                  "{WIDTH}",
                  thumbnail_size.toString()
                ),
              fullImage: item.media_links.cdn_url,
              createdAt: item.created_at,
              mediaClass: "dimensional",
              engineCategory: item.origin_category as FilterEngineCategories,
              name: item.maybe_title ?? undefined,
            }));

            setAllItems((prev) => (reset ? newItems : [...prev, ...newItems]));
            const userPagination = userFilesResponse.pagination;
            const current = userPagination?.current ?? 0;
            const total = userPagination?.total_page_count ?? 1;
            setPageIndex(current + 1);
            setHasMore(current + 1 < total);
          } else {
            if (reset) setAllItems([]);
            setHasMore(false);
          }
        } catch (error) {
          console.error("Failed to fetch 3d library items:", error);
        }
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
              (item: any) => item.media_type !== FilterMediaType.SCENE_JSON
            )
            .map((item: any) => ({
              id: item.token,
              label: item.maybe_title || "Image Generation",
              thumbnail:
                item.media_class === "video"
                  ? item.media_links.maybe_video_previews.still
                  : item.media_class === "dimensional"
                  ? item.cover_image?.maybe_cover_image_public_bucket_url
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
          setAllItems((prev) => (reset ? newItems : [...prev, ...newItems]));
          // Pagination logic
          const current = response.pagination?.current ?? 0;
          const total = response.pagination?.total_page_count ?? 1;
          setPageIndex(current + 1);
          setHasMore(current + 1 < total);
        }
      } catch (error) {
        console.error("Failed to fetch library items:", error);
      }
      setLoading(false);
    };

    // refresh logic
    const refreshGallery = useCallback(() => {
      setAllItems([]);
      setPageIndex(0);
      setHasMore(true);
      loadItems(true);
    }, [setAllItems, setPageIndex, setHasMore, loadItems]);

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
              </div>
            )}

            <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
              {loading && allItems.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-white/60">
                    <LoadingSpinner className="h-12 w-12" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 p-4">
                  {Object.entries(groupItemsByDate(allItems)).map(
                    ([date, dateItems]) => {
                      const filteredItems = dateItems.filter((item) => {
                        if ((item as any).mediaType === "scene_json")
                          return false;
                        if (activeFilter === "3d") {
                          return item.mediaClass === "dimensional";
                        }
                        if (activeFilter === "image") {
                          return item.mediaClass === "image";
                        }
                        if (activeFilter === "video") {
                          return item.mediaClass === "video";
                        }
                        if (activeFilter === "all") {
                          return (
                            item.mediaClass !== "audio" &&
                            (item as any).mediaType !== "scene_json"
                          );
                        }
                        return true;
                      });
                      if (filteredItems.length === 0) return null;
                      return (
                        <div key={date}>
                          <h3 className="text-md mb-2 font-medium text-white/60">
                            {date}
                          </h3>
                          <div
                            className={twMerge("grid", gapClass)}
                            style={{
                              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                            }}
                          >
                            {filteredItems.map((item) => (
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
                      );
                    }
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
