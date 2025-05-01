import { Modal } from "@storyteller/ui-modal";
import { LightboxModal } from "@storyteller/ui-lightbox-modal";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

export interface GalleryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage?: string | null;
  createdAt: string;
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
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
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
    tabs,
    activeTab,
    onTabChange,
  }: GalleryModalProps) => {
    const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
    const [loading, setLoading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(
      null
    );
    const [isLightboxVisible, setIsLightboxVisible] = useState(false);
    const [failedImageUrls] = useState<Set<string>>(new Set());
    const [username, setUsername] = useState<string>("");

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
      getUsername();
    }, [usersApi]);

    useEffect(() => {
      const loadItems = async () => {
        if (!username) return;
        setLoading(true);
        try {
          const response = await api.listUserMediaFiles({
            filter_media_classes: [FilterMediaClasses.IMAGE],
            username: username,
            include_user_uploads: activeTab === "uploads",
            user_uploads_only: activeTab === "uploads",
          });
          if (response.success && response.data) {
            const newItems = response.data.map((item: any) => ({
              id: item.token,
              label: item.maybe_title || "Image Generation",
              thumbnail: item.thumbnail,
              fullImage: item.fullImage,
              createdAt: item.created_at,
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isOpen, username]);

    // useEffect(() => {
    //   console.log("LibraryModal render caused by:", {
    //     isOpen,
    //     activeTab,
    //     selectedItemIds,
    //   });
    // }, [isOpen, activeTab, selectedItemIds]);

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

    return (
      <>
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          className={twMerge(
            "h-[620px] max-w-4xl",
            mode === "view" && "h-[80vh] max-h-[870px] max-w-7xl"
          )}
          childPadding={false}
          showClose={false}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 p-4 py-3">
              <div className="grid grid-cols-3 items-center">
                <h2 className="text-xl font-semibold">
                  {mode === "select" ? "Select Images" : "Gallery"}
                </h2>
                <div className="flex items-center justify-center">
                  <TabSelector
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    className="w-auto"
                  />
                </div>
                <div className="flex justify-end">
                  <CloseButton onClick={onClose} />
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
                        className={twMerge(
                          "grid grid-cols-5 gap-1",
                          mode === "view" && "grid-cols-5"
                        )}
                      >
                        {dateItems.map((item) => (
                          <button
                            key={item.id}
                            className={twMerge(
                              "group relative aspect-square overflow-hidden rounded-md border-[3px] transition-all",
                              mode === "select" &&
                                selectedItemIds.includes(item.id)
                                ? "border-primary"
                                : "border-transparent hover:border-white"
                            )}
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="relative h-full w-full">
                              {!item.thumbnail ? (
                                <div className="flex h-full w-full items-center justify-center bg-gray-800">
                                  <span className="text-white/60">
                                    Image not available
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={item.thumbnail}
                                  alt={item.label}
                                  className="h-full w-full object-cover"
                                  onError={() =>
                                    handleImageError(item.thumbnail!)
                                  }
                                  crossOrigin="anonymous"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              {mode === "select" &&
                                selectedItemIds.includes(item.id) && (
                                  <div className="absolute inset-0 bg-white/30" />
                                )}
                            </div>
                            {mode === "select" &&
                              selectedItemIds.includes(item.id) && (
                                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                                  <FontAwesomeIcon
                                    icon={faCheck}
                                    className="text-sm"
                                  />
                                </div>
                              )}
                          </button>
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
          imageUrl={imageUrl}
          imageAlt={lightboxImage?.label || ""}
          onImageError={() => imageUrl && handleImageError(imageUrl)}
          title={lightboxImage?.label}
          createdAt={lightboxImage?.createdAt}
          downloadUrl={imageUrl}
        />
      </>
    );
  }
);

GalleryModal.displayName = "GalleryModal";

export default GalleryModal;
