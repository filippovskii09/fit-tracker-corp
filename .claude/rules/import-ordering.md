---
paths:
  - "src/**/*.js"
  - "src/**/*.jsx"
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Import ordering

Keep imports grouped and ordered consistently.

## Groups

Use this order:

1. External packages
2. Blank line
3. Internal project imports

Example:

```js
import PropTypes from 'prop-types';
import { Badge, Stack } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { DASHBOARD_VIEWS } from '../../constants';
import ResourcesTab from '../ResourcesTab';
import messages from './messages';

Internal relative imports

Within internal relative imports, order by distance from the current file:

farther imports first;
closer imports last.

Use:

../../...
../...
./...


So prefer:

import { DASHBOARD_VIEWS } from '../../constants';
import ResourcesTab from '../ResourcesTab';
import messages from './messages';

Avoid:

import ResourcesTab from '../ResourcesTab';
import { DASHBOARD_VIEWS } from '../../constants';
import messages from './messages';
