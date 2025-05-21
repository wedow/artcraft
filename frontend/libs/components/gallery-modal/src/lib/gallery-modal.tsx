import { Modal } from "@storyteller/ui-modal";
import { LightboxModal } from "@storyteller/ui-lightbox-modal";
import { Button } from "@storyteller/ui-button";
import { CloseButton } from "@storyteller/ui-close-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FilterMediaClasses,
  GalleryModalApi,
  UsersApi,
} from "@storyteller/api";
import { twMerge } from "tailwind-merge";
import { GalleryDraggableItem } from "./GalleryDraggableItem";
import { useSignals } from "@preact/signals-react/runtime";
import {
  galleryModalVisibleDuringDrag,
  galleryReopenAfterDragSignal,
} from "./galleryModalSignals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faBorderAll,
  faImage,
  faVideo,
  faCube,
  faUpload,
} from "@fortawesome/pro-solid-svg-icons";
import { PopoverMenu } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";

export interface GalleryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage?: string | null;
  createdAt: string;
  mediaClass?: string;
}

interface GroupedItems {
  [date: string]: GalleryItem[];
}

type ModalMode = "select" | "view";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  selectedItemIds?: string[];
  onSelectItem?: (id: string) => void;
  maxSelections?: number;
  onUseSelected?: (selectedItems: GalleryItem[]) => void;
  onDownloadClicked?: (url: string) => Promise<void>;
  onAddToSceneClicked?: (
    url: string,
    media_id: string | undefined
  ) => Promise<void>;
}

export const GalleryModal = React.memo(
  ({
    isOpen,
    onClose,
    mode = "view",
    selectedItemIds = [],
    onSelectItem,
    maxSelections = 4,
    onUseSelected,
    onDownloadClicked,
    onAddToSceneClicked,
  }: GalleryModalProps) => {
    const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
    const [loading, setLoading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(
      null
    );
    const [isLightboxVisible, setIsLightboxVisible] = useState(false);
    const [failedImageUrls] = useState<Set<string>>(new Set());
    const [username, setUsername] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState("all");
    const minColumns = 3;
    const maxColumns = 12;
    // Default gridColumns to 5
    const defaultGridColumns = 5;
    const [sliderValue, setSliderValue] = useState(
      maxColumns - (defaultGridColumns - minColumns)
    );
    const gridColumns = maxColumns - (sliderValue - minColumns);

    const imageUrl = lightboxImage?.fullImage || "";

    const api = useMemo(() => new GalleryModalApi(), []);
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
      if (isOpen) {
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
        case "uploaded":
          return [FilterMediaClasses.IMAGE, FilterMediaClasses.VIDEO];
        default:
          return undefined;
      }
    };

    useEffect(() => {
      const loadItems = async () => {
        if (!username) return;
        setLoading(true);
        try {
          let response = null;
          const filterMediaClasses = getFilterMediaClass(activeFilter);
          if (activeFilter === "uploaded") {
            response = await api.listUserMediaFiles({
              filter_media_classes: filterMediaClasses,
              username: username,
              include_user_uploads: true,
              user_uploads_only: true,
            });
          } else if (filterMediaClasses) {
            response = await api.listUserMediaFiles({
              filter_media_classes: filterMediaClasses,
              username: username,
              include_user_uploads: false,
              user_uploads_only: false,
            });
          } else {
            response = await api.listUserMediaFiles({
              username: username,
              include_user_uploads: false,
              user_uploads_only: false,
            });
          }

          if (response.success && response.data) {
            const thumbnail_size = 250;
            const newItems = response.data.map((item: any) => ({
              id: item.token,
              label: item.maybe_title || "Image Generation",
              thumbnail:
                item.media_class === "video"
                  ? item.media_links.maybe_video_previews.still
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
            setGroupedItems(groupItemsByDate(newItems));
          }
        } catch (error) {
          console.error("Failed to fetch library items:", error);
        }
        setLoading(false);
      };

      if (isOpen) {
        loadItems();
      }
    }, [activeFilter, isOpen, username]);

    const handleItemClick = useCallback(
      (item: GalleryItem) => {
        if (mode === "select" && onSelectItem) {
          onSelectItem(item.id);
        } else {
          setLightboxImage(item);
          setIsLightboxVisible(true);
        }
      },
      [mode, onSelectItem]
    );

    const handleCloseLightbox = useCallback(() => {
      setIsLightboxVisible(false);
      // Wait for animation to complete before removing the image
      setTimeout(() => setLightboxImage(null), 300);
    }, []);

    const handleDeselectAll = useCallback(() => {
      selectedItemIds.forEach((id: any) => onSelectItem?.(id));
    }, [selectedItemIds, onSelectItem]);

    const handleUseSelected = useCallback(() => {
      const selectedItems = Object.values(groupedItems)
        .flat()
        .filter((item) => selectedItemIds.includes(item.id));
      onUseSelected?.(selectedItems);
    }, [groupedItems, selectedItemIds, onUseSelected]);

    useSignals();

    // Compute gap class based on gridColumns
    let gapClass = "gap-0.5";
    if (gridColumns <= 4) gapClass = "gap-1.5";
    else if (gridColumns <= 7) gapClass = "gap-1";

    return (
      <>
        <Modal
          isOpen={
            mode === "view"
              ? isOpen && galleryModalVisibleDuringDrag.value
              : isOpen
          }
          onClose={onClose}
          className={twMerge(
            "h-[620px] max-w-4xl",
            mode === "view" && "h-[640px] max-w-4xl"
          )}
          childPadding={false}
          showClose={false}
          draggable={mode === "view"}
          allowBackgroundInteraction={mode === "view" ? true : false}
          closeOnOutsideClick={false}
        >
          {mode === "view" && (
            <Modal.DragHandle>
              <div className="absolute left-0 top-0 z-[50] h-[60px] w-full cursor-move" />
            </Modal.DragHandle>
          )}
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 p-4 py-3">
              <div className="grid grid-cols-2 items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    {mode === "select" ? "Select Images" : "Gallery"}
                  </h2>
                  {mode === "view" && (
                    <div className="flex items-center relative z-[51]">
                      <input
                        type="checkbox"
                        id="gallery-reopen-after-drag"
                        checked={galleryReopenAfterDragSignal.value}
                        onChange={(e) =>
                          (galleryReopenAfterDragSignal.value =
                            e.target.checked)
                        }
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
                  {/* Slider */}
                  <div className="w-48 mr-4 relative z-[51] flex items-center gap-2">
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
                  {/* Filter popover */}
                  <PopoverMenu
                    panelTitle="Filter"
                    position="bottom"
                    align="end"
                    buttonClassName="relative z-[51] mr-3"
                    panelClassName="min-w-36"
                    items={FILTERS.map((f) => ({
                      label: f.label,
                      selected: activeFilter === f.id,
                      icon: f.icon,
                    }))}
                    onSelect={(item) => {
                      const filter = FILTERS.find(
                        (f) => f.label === item.label
                      );
                      if (filter) setActiveFilter(filter.id);
                    }}
                    triggerIcon={<FontAwesomeIcon icon={faFilter} />}
                    triggerLabel={
                      FILTERS.find((f) => f.id === activeFilter)?.label
                    }
                    mode="toggle"
                    showIconsInList={true}
                  />
                  {mode === "view" && <Modal.ExpandButton />}
                  <CloseButton onClick={onClose} className="relative z-[51]" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-white/60">
                    <LoadingSpinner className="h-12 w-12" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 p-4">
                  {Object.entries(groupedItems).map(([date, dateItems]) => (
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
                        {dateItems
                          .filter((item) => {
                            if (activeFilter === "3d")
                              return item.mediaClass === "3d";
                            return true;
                          })
                          .map((item) => (
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
                            />
                          ))}
                      </div>
                    </div>
                  ))}
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

        <LightboxModal
          isOpen={isLightboxVisible}
          onClose={handleCloseLightbox}
          onCloseGallery={onClose}
          imageUrl={imageUrl}
          imageAlt={lightboxImage?.label || ""}
          onImageError={() => imageUrl && handleImageError(imageUrl)}
          title={lightboxImage?.label}
          createdAt={lightboxImage?.createdAt}
          downloadUrl={imageUrl}
          mediaId={lightboxImage?.id}
          onDownloadClicked={onDownloadClicked}
          onAddToSceneClicked={onAddToSceneClicked}
          activeTab={activeFilter}
        />
      </>
    );
  }
);

GalleryModal.displayName = "GalleryModal";

export default GalleryModal;
