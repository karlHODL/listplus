import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Item } from '../types';
import { ItemRow } from './ItemRow';

interface Props {
  items: Item[];
  onToggle: (id: string) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function ItemList({ items, onToggle, onEdit, onDelete, onReorder }: Props) {
  const unpurchased = items.filter(i => !i.purchased).sort((a, b) => a.sort_order - b.sort_order);
  const purchased = items.filter(i => i.purchased).sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  if (items.length === 0) {
    return <p className="empty-state">No items yet. Add one above!</p>;
  }

  return (
    <div className="item-list">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={unpurchased.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {unpurchased.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      {purchased.length > 0 && (
        <>
          <div className="section-divider">Got It ({purchased.length})</div>
          {purchased.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </div>
  );
}
