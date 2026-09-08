import { useState } from 'react';

import { FilterControl } from './components';
import { FILTER_DEFINITIONS } from './data';
import type { FilterId, FilterSelection } from './types';

export type * from './types';

const INITIAL_SELECTION: FilterSelection = {
  level: null,
  goal: null,
  gear: null,
  days: null,
};

export const RoutineFilters = () => {
  const [selection, setSelection] =
    useState<FilterSelection>(INITIAL_SELECTION);
  const [openFilterId, setOpenFilterId] = useState<FilterId | null>(null);

  const handleOpen = (id: FilterId) => setOpenFilterId(id);
  // Bound to the filter that requested the close (see renderControl) and only
  // clears state if that filter is still the open one. This avoids a race
  // where an outside-click dismissal from a filter's own ClickAwayListener
  // fires after another filter's trigger has already opened, which would
  // otherwise close the newly opened dropdown instead of the old one.
  const handleClose = (id: FilterId) =>
    setOpenFilterId((prev) => (prev === id ? null : prev));

  const handleSelect = (id: FilterId, value: string) => {
    setSelection((prev) => ({ ...prev, [id]: value }));
    setOpenFilterId(null);
  };

  const handleClear = (id: FilterId) => {
    setSelection((prev) => ({ ...prev, [id]: null }));
  };

  const selectedFilters = FILTER_DEFINITIONS.filter(
    (filter) => selection[filter.id] !== null,
  );
  const unselectedFilters = FILTER_DEFINITIONS.filter(
    (filter) => selection[filter.id] === null,
  );
  const showDivider =
    selectedFilters.length > 0 && unselectedFilters.length > 0;

  const renderControl = (filter: (typeof FILTER_DEFINITIONS)[number]) => (
    <FilterControl
      key={filter.id}
      filter={filter}
      selectedValue={selection[filter.id]}
      isOpen={openFilterId === filter.id}
      onOpen={handleOpen}
      onClose={() => handleClose(filter.id)}
      onSelect={handleSelect}
      onClear={handleClear}
    />
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedFilters.map(renderControl)}
      {showDivider ? (
        <span aria-hidden="true" className="h-5 w-px bg-border-subtle" />
      ) : null}
      {unselectedFilters.map(renderControl)}
    </div>
  );
};
