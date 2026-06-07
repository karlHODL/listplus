import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { List, Item } from './types';
import { ListTabs } from './components/ListTabs';
import { ItemList } from './components/ItemList';
import { AddItem } from './components/AddItem';
import { arrayMove } from '@dnd-kit/sortable';

function App() {
  const [lists, setLists] = useState<List[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: listsData }, { data: itemsData }] = await Promise.all([
        supabase.from('lists').select('*').order('sort_order'),
        supabase.from('items').select('*').order('sort_order'),
      ]);

      if (listsData && listsData.length === 0) {
        const created = await createDefaultLists();
        setLists(created);
        setActiveListId(created[0]?.id ?? null);
      } else if (listsData) {
        setLists(listsData);
        setActiveListId(listsData[0]?.id ?? null);
      }

      if (itemsData) setItems(itemsData);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const refetchLists = () =>
      supabase.from('lists').select('*').order('sort_order').then(({ data }) => {
        if (data) setLists(data);
      });

    const refetchItems = () =>
      supabase.from('items').select('*').order('sort_order').then(({ data }) => {
        if (data) setItems(data);
      });

    const listChannel = supabase
      .channel('lists-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, refetchLists)
      .subscribe();

    const itemChannel = supabase
      .channel('items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, refetchItems)
      .subscribe();

    return () => {
      supabase.removeChannel(listChannel);
      supabase.removeChannel(itemChannel);
    };
  }, []);

  async function createDefaultLists(): Promise<List[]> {
    const { data } = await supabase
      .from('lists')
      .insert([
        { name: 'Groceries', sort_order: 0 },
        { name: 'Household', sort_order: 1 },
        { name: 'Other', sort_order: 2 },
      ])
      .select();
    return data ?? [];
  }

  const activeItems = items.filter(i => i.list_id === activeListId);

  const addItem = async (name: string) => {
    if (!activeListId) return;
    const unpurchasedCount = activeItems.filter(i => !i.purchased).length;
    await supabase.from('items').insert({
      list_id: activeListId,
      name,
      sort_order: unpurchasedCount,
      purchased: false,
    });
  };

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await supabase.from('items').update({ purchased: !item.purchased }).eq('id', id);
  };

  const editItem = async (id: string, name: string) => {
    await supabase.from('items').update({ name }).eq('id', id);
  };

  const deleteItem = async (id: string) => {
    await supabase.from('items').delete().eq('id', id);
  };

  const reorderItems = async (activeId: string, overId: string) => {
    const unpurchased = activeItems
      .filter(i => !i.purchased)
      .sort((a, b) => a.sort_order - b.sort_order);

    const oldIndex = unpurchased.findIndex(i => i.id === activeId);
    const newIndex = unpurchased.findIndex(i => i.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(unpurchased, oldIndex, newIndex);

    setItems(prev => {
      const others = prev.filter(i => i.list_id !== activeListId || i.purchased);
      return [...others, ...reordered.map((item, i) => ({ ...item, sort_order: i }))];
    });

    await Promise.all(
      reordered.map((item, i) =>
        supabase.from('items').update({ sort_order: i }).eq('id', item.id)
      )
    );
  };

  const addList = async () => {
    const { data } = await supabase
      .from('lists')
      .insert({ name: 'New List', sort_order: lists.length })
      .select()
      .single();
    if (data) setActiveListId(data.id);
  };

  const renameList = async (id: string, name: string) => {
    await supabase.from('lists').update({ name }).eq('id', id);
  };

  const deleteList = async (id: string) => {
    await supabase.from('lists').delete().eq('id', id);
    const remaining = lists.filter(l => l.id !== id);
    setActiveListId(remaining[0]?.id ?? null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>ListPlus</h1>
      </header>
      <ListTabs
        lists={lists}
        activeId={activeListId}
        onSelect={setActiveListId}
        onRename={renameList}
        onAdd={addList}
        onDelete={deleteList}
      />
      <main className="app-main">
        <AddItem onAdd={addItem} />
        <ItemList
          items={activeItems}
          onToggle={toggleItem}
          onEdit={editItem}
          onDelete={deleteItem}
          onReorder={reorderItems}
        />
      </main>
    </div>
  );
}

export default App;
