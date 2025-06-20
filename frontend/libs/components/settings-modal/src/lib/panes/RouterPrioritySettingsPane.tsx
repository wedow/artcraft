import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/pro-solid-svg-icons";

interface RouterItem {
  id: string;
  name: string;
  emoji: string;
}

interface SortableItemProps {
  id: string;
  name: string;
  emoji: string;
  isUpdating?: boolean;
}

const SortableItem = ({
  id,
  name,
  emoji,
  isUpdating = false,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center justify-between rounded-lg bg-white/5 p-3 transition-colors duration-200
        ${
          isUpdating
            ? "cursor-wait opacity-60"
            : "cursor-move hover:bg-white/10"
        }
        ${isDragging ? "opacity-50 shadow-lg" : ""}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{emoji}</span>
        <span className="font-medium">{name}</span>
      </div>
      <div className="flex items-center">
        <FontAwesomeIcon
          icon={faGripVertical}
          className="text-white/40 text-sm"
        />
      </div>
    </div>
  );
};

export const RouterPrioritySettingsPane = () => {
  const [items, setItems] = useState<RouterItem[]>([
    { id: "artcraft-3d", name: "ArtCraft 3D", emoji: "🎨" },
    { id: "gpt-image-1", name: "GPT Image 1 (GPT-4o)", emoji: "🤖" },
    { id: "flux-pro-ultra", name: "Flux Pro Ultra", emoji: "⚡" },
    { id: "recraft-3", name: "Recraft 3", emoji: "🌟" },
    { id: "flux-kontext", name: "Flux.1 Kontext", emoji: "🔮" },
  ]);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateRouterPriorityOnBackend = async (newOrder: RouterItem[]) => {
    try {
      setIsUpdating(true);
      console.log("Updating router priority on backend:", newOrder);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500)); //remove this - BFlat

      //api call here

      console.log("Router priority updated successfully");
    } catch (error) {
      console.error("Failed to update router priority:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over?.id);

        const newOrder = arrayMove(prevItems, oldIndex, newIndex);

        // Send update to backend
        updateRouterPriorityOnBackend(newOrder);

        return newOrder;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          Model Router Priority
          {isUpdating && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full animate-pulse">
              Updating...
            </span>
          )}
        </h3>
        <p className="text-sm text-white/70 mb-4">
          Drag and drop to reorder model priority. Higher items will be tried
          first.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                name={item.name}
                emoji={item.emoji}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
