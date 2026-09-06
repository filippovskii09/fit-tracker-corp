import type { IconType } from 'react-icons';

// Minimal stand-ins for react-icons components: real Ionicons render an
// <svg data-testid=".."> honouring the `size` prop as width/height, which is
// exactly what the icon-size assertions need to observe.
const makeIcon =
  (testId: string): IconType =>
  ({ size }) => <svg data-testid={testId} width={size} height={size} />;

export const HomeIcon = makeIcon('home-icon');
export const WorkoutsIcon = makeIcon('workouts-icon');
export const ThirdIcon = makeIcon('third-icon');
export const FourthIcon = makeIcon('fourth-icon');
export const FifthIcon = makeIcon('fifth-icon');
