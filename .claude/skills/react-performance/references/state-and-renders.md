# State and render behavior

## 1. Keep state minimal

Do not store values that can be calculated from existing props/state.

Prefer:

const fullName = `${firstName} ${lastName}`

over:

const [fullName, setFullName] = useState(...)
useEffect(() => setFullName(...), [firstName, lastName])

Redundant state introduces an extra update and often an extra render pass.

## 2. Avoid duplicated sources of truth

Do not keep:

- original data;
- filtered data;
- sorted data;
- count;
- selected object;

all as independent state when they can be derived from authoritative state.

Store the minimum authoritative representation.

Derive cheap values during render.

## 3. State shape matters

Prefer state structures that avoid contradictory or duplicated information.

For relational/large collections in normalized external stores, normalized entities can allow narrower updates and lookups.

Do not normalize small local state mechanically.

## 4. Parent updates propagate

By default, when a component renders, React renders its children recursively unless React can skip work through compiler/memoization or preserved element identity.

Therefore:

- keep volatile state out of high-level components where possible;
- isolate expensive subtrees from unrelated state ownership;
- do not treat changed props as the only source of rerenders.

## 5. Context updates

Components reading a Context rerender when the provider value changes.

Avoid one broad provider value containing unrelated domains such as:

- current user;
- theme;
- live form state;
- websocket data;
- notifications;
- editor state.

Split providers by ownership/change frequency when that improves architecture.

Do not split Context into dozens of fragments without need.

## 6. External store subscriptions

Subscribe to the smallest value the component needs.

For Redux:

- prefer narrow `useSelector` results;
- avoid returning fresh aggregate objects unless equality/memoized selectors justify it;
- use memoized selectors for expensive derived data or stable composite results;
- normalize relational collections when appropriate.

For other stores:

- use selector/subscription APIs that avoid waking unrelated consumers when available.

Do not build manual subscription systems around a library that already provides this capability.

## 7. Lists

For lists:

- use stable semantic keys;
- avoid index keys when list identity can change;
- avoid recreating expensive per-row derived work unnecessarily;
- keep row state inside the row when ownership allows;
- avoid making each row depend on broad Context/store objects.

For very large visible collections, virtualization may be appropriate.

Do not virtualize small lists by default; it adds complexity, accessibility, measurement, and scrolling concerns.

## 8. Refs

Use refs for mutable values that should persist but do not affect rendering.

Appropriate examples:

- DOM node references;
- timers/imperative handles;
- previous/non-visual mutable values.

Do not move visual state into refs to suppress legitimate React updates.
