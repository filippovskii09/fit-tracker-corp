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
            backgroundColor: '#181D1B',
            color: 'white',
            borderRadius: '12px',
            marginTop: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
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
