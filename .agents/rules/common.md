# Common Development Rules

These rules apply universally to any development or testing tasks in this project involving JavaScript or TypeScript, on both the frontend and backend (Node.js). You MUST follow these guidelines strictly.

## 1. Imports

- **Aliases**: Prefer using path aliases (e.g., `@src`, `@setupTest`) over relative paths whenever possible. This is a high priority.
- **Order**: Imports MUST be ordered from "furthest" (external) to "closest" (local relative).
  - **Group 1**: External/Third-party libraries (e.g., `react`, `lodash`, `@edx/...`).
  - **Group 2**: Internal modules using aliases (e.g., `@setupTest`, `@src/...`).
  - **Group 3**: Relative local imports (`../...`, `./...` — from furthest parent directory to closest sibling).
- **Separation**: Groups MUST be separated by a single empty line. Specifically, external libraries must be separated from internal/aliased imports.

**Example:**

```javascript
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import capitalize from 'lodash.capitalize';

import {
  render, screen, within, userEvent, waitFor,
} from '@setupTest';
import { ASSET_CATEGORIES, ASSETS_STATUSES } from '@src/constants';
import { formatMessageTemplate } from '@src/utils';
import assetCardMessages from '@src/generic/AssetCard/messages';
import dropdownActionsMessages from '@src/generic/dropdown-actions/messages';
import { extractFileNameFromUrl } from '@src/generic/files/utils';
import modalWrapperMessages from '@src/generic/modal-wrapper/messages';
import assetDetailsModalMessages from '../components/AssetDetailsModal/messages';
import assetPreviewCellMessages from '../components/AssetPreviewCell/messages';
import tableNavigationMessages from '../components/TableNavigation/messages';
import {
  useAssetsListData,
  useAssetsOptionsData,
  useAssetVersionsData,
} from '../data/hooks';
import {
  assetsListData,
  assetsListDetailsData,
  assetsOptionsData,
  assetVersionsData,
} from '../__mocks__';
import { DEFAULT_ASSETS_PAGE_NUMBER, VIEW_TYPES } from '../constants';
import messages from '../messages';
import AssetsList from '..';
```

```javascript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ResponseMessages } from '@src/common/messages';
import { WorkoutEntity } from './entities';
import { CreateWorkoutDto } from './dto';
```

## 2. Naming Conventions (Airbnb / Google Style Guide)

Consistent naming reduces cognitive load and makes the codebase predictable. Strictly adhere to these conventions:
- **`camelCase`**: Use for all variables, properties, methods, and functions. (e.g., `const userProfile = {}`, `function getUser() {}`).
- **`PascalCase`**: Use exclusively for Classes, React Components, and Interfaces/Types. (e.g., `class UserService {}`, `function UserProfile() {}`).
- **`UPPER_SNAKE_CASE`**: Use ONLY for exported constants, static configurations, and "magic strings/numbers". (e.g., `const MAX_RETRIES = 5;`, `const ASSET_STATUSES = {...}`).
- **Boolean Variables**: Should be prefixed with `is`, `has`, `should`, or `can` to easily identify their type (e.g., `isVisible`, `hasAccess`).

## 3. Object Destructuring (Airbnb Style Guide 5.1)

Always prefer object destructuring over dot notation. Destructuring explicitly visualizes what pieces of an object your function depends on, acting as self-documenting code.

- **Function Parameters**: If a function takes a configuration object or props, destructure them immediately in the parameter list or on the very first line of the function.
- **Multiple Properties**: If you need to access more than one property of an object, destructure them into variables first.

**Bad (Avoid):**
```javascript
function UserCard(props) {
  const name = props.user.name;
  return <div>{props.firstName} {props.lastName}</div>;
}
```

**Good (Do):**
```javascript
function userCard({ user, firstName, lastName }) {
  const { name } = user;
  return <div>{firstName} {lastName}</div>;
}
```

## 4. Single Responsibility & Function Size (Clean Code by Robert C. Martin)

Functions and components should do **exactly one thing** and do it well (Single Responsibility Principle). 
- **Size**: Functions should be small. If a function goes over 30-40 lines of logic, consider extracting parts of it into helper functions.
- **Naming as a detector**: If you have to use the word "and" in your function name (e.g., `validateAndSaveUser`), the function is doing too much. Break it into `validateUser(user)` and `saveUser(user)`.
- **Nesting limit**: Do not nest logic (like `if` statements or loops) deeper than 2 levels. Use "arly returns" (Guard Clauses) to flatten the logic.

## 5. Hardcoded Strings & Localization (i18n Best Practices)

NEVER hardcode user-facing strings directly into the component or code. All text visible to the user must be managed through the project's localization or internationalization pipeline.

- Use localization dictionaries, exported `messages` objects, or localization hooks (like `formatMessage`).
- Treat generic strings as static constants if they are not user-facing (e.g., API keys, system status values), and place them in `constants.js` with `UPPER_SNAKE_CASE`.

**Bad (Avoid):**
```javascript
<button>Save Changes</button>
```

**Good (Do):**
```javascript
import messages from './messages';
// ...
<button>{formatMessage(messages.saveChanges)}</button>
```
