FROM node:24-alpine AS builder
WORKDIR /fit-tracker-backend

COPY backend/package.json backend/package-lock.json backend/tsconfig.json backend/tsconfig.build.json backend/.eslintrc.js backend/.prettierrc ./
COPY backend/package.json ./backend/package.json

RUN npm install --ignore-scripts

COPY backend ./

RUN npm run build

EXPOSE 3000

# Run compiled migrations against the production database before starting
# the app; a failed migration fails the container start instead of booting
# against a stale/partial schema. Uses the same DataSource (and migrations
# table) as `npm run migration:run` (see src/db/data-source.ts).
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/main.js"]
