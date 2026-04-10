import { Box, Typography, Chip, TextField } from '@mui/material';

import { BaseAutocomplete } from '@ui';
import type { IExerciseSelectProps } from './types';
import { useGetAllExercises } from './queries';

export const ExerciseSelect = ({
  onSelect,
  disabled,
}: IExerciseSelectProps) => {
  const { data: exercises = [], isLoading } = useGetAllExercises();
  return (
    <BaseAutocomplete
      disabled={disabled || isLoading}
      options={exercises}
      getOptionLabel={(option) => option.name}
      filterOptions={(options, state) => {
        const inputValue = state.inputValue.toLowerCase();
        return options.filter(
          (option) =>
            option.name.toLowerCase().includes(inputValue) ||
            option.muscleGroup.toLowerCase().includes(inputValue),
        );
      }}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <li
            key={key}
            {...otherProps}
            style={{ borderBottom: '1px solid var(--app-dialog-border)' }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              width="100%"
              alignItems="center"
            >
              <Typography variant="body1" color="textPrimary">
                {option.name}
              </Typography>
              <Chip
                label={option.muscleGroup}
                size="small"
                sx={{
                  backgroundColor: 'var(--color-accent-soft)',
                  color: 'var(--color-primary)',
                  fontSize: '10px',
                  height: '20px',
                }}
              />
            </Box>
          </li>
        );
      }}
      onChange={(_, value) => {
        if (value) {
          onSelect(value);
        }
      }}
      loading={isLoading}
      itemType="Find Exercise"
      renderInput={(params) => <TextField {...params} />}
    />
  );
};
