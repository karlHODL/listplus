import { useState, useRef, useEffect } from 'react';
import type { List } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  lists: List[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function ListTabs({ lists, activeId, onSelect, onRename, onAdd, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  const startEdit = (list: List, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(list.id);
    setEditValue(list.name);
  };

  const saveEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  };

  const confirmingList = lists.find(l => l.id === confirmDeleteId);

  return (
    <>
      <div className="list-tabs-container">
        <div className="list-tabs">
          {lists.map(list => (
            <div
              key={list.id}
              className={`list-tab${list.id === activeId ? ' active' : ''}`}
              onClick={() => onSelect(list.id)}
            >
              {editingId === list.id ? (
                <input
                  ref={inputRef}
                  className="tab-edit-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(list.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(list.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span onDoubleClick={e => startEdit(list, e)}>{list.name}</span>
              )}
              {lists.length > 1 && list.id === activeId && editingId !== list.id && (
                <button
                  className="tab-delete-btn"
                  onClick={e => { e.stopPropagation(); setConfirmDeleteId(list.id); }}
                  aria-label={`Delete ${list.name} list`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button className="add-list-btn" onClick={onAdd}>+ List</button>
        </div>
      </div>

      {confirmingList && (
        <ConfirmModal
          message={`Delete "${confirmingList.name}" and all its items?`}
          onConfirm={() => { onDelete(confirmingList.id); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
