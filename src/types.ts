export interface List {
  id: string;
  name: string;
  sort_order: number;
}

export interface Item {
  id: string;
  list_id: string;
  name: string;
  purchased: boolean;
  sort_order: number;
}
