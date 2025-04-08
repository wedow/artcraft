import { TransitionDialogue } from "~/components/reusable/TransitionDialogue";
import { faCheck, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, LoadingSpinner } from "~/components";
import { TabSelector } from "~/components/reusable/TabSelector";
import { useState, useEffect, Fragment } from "react";
import { LibraryModalApi } from "./LibraryModalApi";
import { FilterMediaClasses } from "../../../../enums";
import { BucketConfig } from "../../../../api/BucketConfig";
import { twMerge } from "tailwind-merge";
import { createPortal } from "react-dom";
import { Transition } from "@headlessui/react";

export interface LibraryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage?: string | null;
  createdAt: string;
}

interface GroupedItems {
  [date: string]: LibraryItem[];
}

type ModalMode = "select" | "view";

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  selectedItemIds?: string[];
  onSelectItem?: (id: string) => void;
  maxSelections?: number;
  onUseSelected?: (selectedItems: LibraryItem[]) => void;
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const LibraryModal = ({
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
}: LibraryModalProps) => {
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
  const [loading, setLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<LibraryItem | null>(null);
  const [isLightboxVisible, setIsLightboxVisible] = useState(false);
  const [failedImageUrls] = useState<Set<string>>(new Set());
  const bucketConfig = new BucketConfig();
  const api = new LibraryModalApi();

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const groupItemsByDate = (items: LibraryItem[]) => {
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
          new Date(a[1][0].createdAt).getTime(),
      ),
    );
  };

  const handleImageError = (url: string) => {
    failedImageUrls.add(url);
  };

  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return null;
    const url = bucketConfig.getGcsUrl(path);
    return failedImageUrls.has(url) ? null : url;
  };

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      try {
        const response = await api.listUserMediaFiles({
          filter_media_classes: [FilterMediaClasses.IMAGE],
        });
        if (response.success && response.data) {
          const newItems = response.data.map((item) => ({
            id: item.token,
            label: item.maybe_title || "Untitled",
            thumbnail: getImageUrl(
              item.cover_image.maybe_cover_image_public_bucket_path ||
                item.public_bucket_path,
            ),
            fullImage: getImageUrl(item.public_bucket_path),
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
  }, [activeTab, isOpen]);

  const handleItemClick = (item: LibraryItem) => {
    if (mode === "select" && onSelectItem) {
      onSelectItem(item.id);
    } else {
      setLightboxImage(item);
      setIsLightboxVisible(true);
    }
  };

  const handleCloseLightbox = () => {
    setIsLightboxVisible(false);
    // Wait for animation to complete before removing the image
    setTimeout(() => setLightboxImage(null), 300);
  };

  return (
    <>
      <TransitionDialogue
        isOpen={isOpen}
        onClose={onClose}
        className={twMerge(
          "h-[620px] max-w-4xl",
          mode === "view" && "h-[80vh] max-h-[870px] max-w-7xl",
        )}
        childPadding={false}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-4">
            <div className="grid grid-cols-3 items-center">
              <h2 className="text-xl font-semibold">
                {mode === "select" ? "Select Images" : "My Library"}
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
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-lg" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-white/60">
                  <LoadingSpinner className="h-12 w-12" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([date, dateItems]) => (
                  <div key={date}>
                    <h3 className="text-md mb-2 font-medium text-white/60">
                      {date}
                    </h3>
                    <div
                      className={twMerge(
                        "grid grid-cols-5 gap-1",
                        mode === "view" && "grid-cols-5",
                      )}
                    >
                      {dateItems.map((item) => (
                        <button
                          key={item.id}
                          className={twMerge(
                            "group relative aspect-square overflow-hidden rounded-md border-[3px] transition-all",
                            mode === "select" &&
                              selectedItemIds.includes(item.id)
                              ? "border-brand-primary"
                              : "border-transparent hover:border-white",
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
                              <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary">
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
                    onClick={() => {
                      selectedItemIds.forEach((id) => onSelectItem?.(id));
                    }}
                    className="text-sm text-white/60 hover:text-white"
                  >
                    Deselect All
                  </button>
                )}
              </div>
              <Button
                onClick={() => {
                  const selectedItems = Object.values(groupedItems)
                    .flat()
                    .filter((item) => selectedItemIds.includes(item.id));
                  onUseSelected?.(selectedItems);
                }}
                disabled={selectedItemIds.length === 0}
              >
                Use selected
              </Button>
            </div>
          )}
        </div>
      </TransitionDialogue>

      {/* Lightbox Modal */}
      {lightboxImage &&
        createPortal(
          <Transition appear show={isLightboxVisible} as={Fragment}>
            <div className="fixed inset-0 z-[100]">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div
                  className="fixed inset-0 cursor-pointer bg-black/60"
                  onClick={handleCloseLightbox}
                />
              </Transition.Child>
              <div
                className="fixed inset-0 flex items-center justify-center p-4"
                onClick={handleCloseLightbox}
              >
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <div
                    className="relative h-[90vh] w-[80vw] rounded-xl bg-[#2C2C2C]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleCloseLightbox}
                      className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-lg" />
                    </button>
                    <div className="grid h-full grid-cols-3 gap-6">
                      <div className="col-span-2 flex h-full items-center justify-center overflow-hidden bg-black/40">
                        {!lightboxImage.fullImage ? (
                          <div className="flex h-full w-full items-center justify-center bg-gray-800">
                            <span className="text-white/60">
                              Image not available
                            </span>
                          </div>
                        ) : (
                          <img
                            src={lightboxImage.fullImage}
                            alt={lightboxImage.label}
                            className="h-full w-full object-contain"
                            onError={() =>
                              handleImageError(lightboxImage.fullImage!)
                            }
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="py-5">Prompt</div>
                    </div>
                  </div>
                </Transition.Child>
              </div>
            </div>
          </Transition>,
          document.body,
        )}
    </>
  );
};
