FROM node:24-alpine AS builder
WORKDIR /fit-tracker-backend

COPY backend/package.json backend/package-lock.json backend/tsconfig.json backend/tsconfig.build.json backend/.eslintrc.js backend/.prettierrc ./
COPY backend/package.json ./backend/package.json

RUN npm install --ignore-scripts

COPY backend ./

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
