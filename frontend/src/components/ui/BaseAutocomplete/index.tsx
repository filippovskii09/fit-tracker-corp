import { Autocomplete, TextField, Paper } from '@mui/material';
import type { AutocompleteProps } from '@mui/material';

export const BaseAutocomplete = <T,>(
  props: AutocompleteProps<T, false, false, false>,
) => {
  return (
    <Autocomplete
      {...props}
      PaperComponent={(paperProps) => (
        <Paper
          {...paperProps}
          sx={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            borderRadius: '12px',
            marginTop: '8px',
            boxShadow: 'var(--shadow-dialog)',
          }}
        />
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={props.itemType || 'Select item'}
          placeholder="Type to search..."
        />
      )}
    />
  );
};
