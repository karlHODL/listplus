import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from '../types';

interface Props {
  item: Item;
  onToggle: (id: string) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function ItemRow({ item, onToggle, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: item.purchased,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Keep value in sync if name changes from real-time update
  useEffect(() => {
    if (!editing) setValue(item.name);
  }, [item.name, editing]);

  const saveEdit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== item.name) onEdit(item.id, trimmed);
    else setValue(item.name);
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className={`item-row${item.purchased ? ' purchased' : ''}`}>
      <div
        className="drag-handle"
        {...(item.purchased ? {} : { ...attributes, ...listeners })}
        aria-label="Drag to reorder"
      >
        ⠿
      </div>
      <input
        type="checkbox"
        checked={item.purchased}
        onChange={() => onToggle(item.id)}
        aria-label={`Mark ${item.name} as ${item.purchased ? 'not purchased' : 'purchased'}`}
      />
      {editing ? (
        <input
          ref={inputRef}
          className="item-edit-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') { setValue(item.name); setEditing(false); }
          }}
        />
      ) : (
        <span
          className="item-name"
          onClick={() => { if (!item.purchased) setEditing(true); }}
        >
          {item.name}
        </span>
      )}
      <button
        className="delete-btn"
        onClick={() => onDelete(item.id)}
        aria-label={`Delete ${item.name}`}
      >
        ×
      </button>
    </div>
  );
}
