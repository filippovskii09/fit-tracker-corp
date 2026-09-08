import { ClickAwayListener, MenuItem, MenuList, Popper } from '@mui/material';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useState } from 'react';
import {
  IoMdArrowDropdown,
  IoMdArrowDropup,
  IoMdCheckmark,
  IoMdClose,
} from 'react-icons/io';

import { DICTIONARY } from '@locales';
import type { IFilterControlProps } from '../types';

const TRIGGER_BASE_CLASSES =
  'flex h-8 items-center gap-1 whitespace-nowrap rounded-full border pl-3 pr-2.5 text-[15px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main';

export const FilterControl = ({
  filter,
  selectedValue,
  isOpen,
  onOpen,
  onClose,
  onSelect,
  onClear,
}: IFilterControlProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const selectedOption = filter.options.find(
    (option) => option.value === selectedValue,
  );

  const handleTriggerClick = () => {
    if (isOpen) {
      onClose();
      return;
    }

    onOpen(filter.id);
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      anchorEl?.focus();
    }
  };

  const handleClearClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClear(filter.id);
  };

  return (
    <div className="relative inline-flex">
      {selectedOption ? (
        <div
          className={`${TRIGGER_BASE_CLASSES} gap-1.5 border-accent-border bg-accent-soft pr-2 text-primary`}
        >
          <button
            ref={setAnchorEl}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={handleTriggerClick}
            className="focus-visible:outline-none"
          >
            {selectedOption.label}
          </button>
          <button
            type="button"
            aria-label={`${DICTIONARY.routineFilters.removeFilterLabel} ${filter.label}`}
            onClick={handleClearClick}
            className="text-primary opacity-70 transition-opacity duration-150 hover:opacity-100 focus-visible:outline-none"
          >
            <IoMdClose size={16} aria-hidden />
          </button>
        </div>
      ) : (
        <button
          ref={setAnchorEl}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={handleTriggerClick}
          className={`${TRIGGER_BASE_CLASSES} ${
            isOpen
              ? 'border-accent-border text-text-primary'
              : 'border-border-subtle bg-surface text-text-subtle'
          }`}
        >
          {filter.label}
          {isOpen ? (
            <IoMdArrowDropup size={16} className="text-primary" aria-hidden />
          ) : (
            <IoMdArrowDropdown size={16} className="text-muted" aria-hidden />
          )}
        </button>
      )}

      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        style={{ zIndex: 20 }}
      >
        <ClickAwayListener onClickAway={onClose}>
          <MenuList
            role="listbox"
            aria-label={filter.label}
            autoFocusItem={isOpen}
            onKeyDown={handleListKeyDown}
            className="min-w-40 rounded-xl border border-border-subtle bg-surface p-1.5 shadow-dialog"
          >
            {filter.options.map((option) => {
              const isSelected = option.value === selectedValue;

              return (
                <MenuItem
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  selected={isSelected}
                  onClick={() => onSelect(filter.id, option.value)}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px] text-text-subtle ${
                    isSelected
                      ? 'bg-white/5 font-semibold text-text-primary'
                      : ''
                  }`}
                >
                  {option.label}
                  {isSelected ? (
                    <IoMdCheckmark
                      size={16}
                      className="text-primary"
                      aria-hidden
                    />
                  ) : null}
                </MenuItem>
              );
            })}
          </MenuList>
        </ClickAwayListener>
      </Popper>
    </div>
  );
};
