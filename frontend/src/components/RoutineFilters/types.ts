export type FilterId = 'level' | 'goal' | 'gear' | 'days';

export interface IFilterOption {
  value: string;
  label: string;
}

export interface IFilterDefinition {
  id: FilterId;
  label: string;
  options: readonly IFilterOption[];
}

export type FilterSelection = Record<FilterId, string | null>;

export interface IFilterControlProps {
  filter: IFilterDefinition;
  selectedValue: string | null;
  isOpen: boolean;
  onOpen: (id: FilterId) => void;
  onClose: () => void;
  onSelect: (id: FilterId, value: string) => void;
  onClear: (id: FilterId) => void;
}
