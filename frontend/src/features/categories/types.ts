export type CategoryKind = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  parent_id: string | null;
  is_default: boolean;
}
