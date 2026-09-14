export type LibraryTabId = 'programs' | 'exercises';

export interface ILibraryTabDefinition {
  id: LibraryTabId;
  label: string;
  count: number;
}
