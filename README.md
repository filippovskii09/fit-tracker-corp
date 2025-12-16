# Fit Tracker Corp

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-v20%2B-green.svg)
![NestJS](https://img.shields.io/badge/backend-NestJS-red.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue)

A comprehensive fitness tracking solution designed to help users log workouts, monitor progress, and analyze historical data. Built with scalability and code quality in mind, using a modern Monorepo architecture.

## Tech Stack

This project uses a robust set of tools to ensure performance, reliability, and developer experience.

- **Backend:** [NestJS](https://nestjs.com/) (Node.js framework), TypeScript
- **Database:** PostgreSQL, TypeORM
- **Infrastructure:** Docker, Docker Compose
- **Quality Assurance:** Jest (Testing), ESLint (Linting), Prettier (Formatting)
- **Git Hooks:** Husky, Lint-staged (Ensures no bad code is committed)
- **Orchestration:** Makefile

## Project Structure

The project follows a **Monorepo** structure to manage multiple services and tooling centrally.

```
├── backend/           # NestJS API application
│   ├── src/           # Source code
│   └── Dockerfile     # Backend container config
├── node_modules/      # Root dependencies (Husky, etc.)
├── docker-compose.yml # Infrastructure orchestration
├── makefile           # Shortcut commands
└── README.md          # Project documentation
```

## Getting Started

Follow these steps to get the project running on your local machine.

### Installation

1. Clone the repository

```
git clone
```

2. Environment Setup. Create .env file in the backend directory. You can copy the example file:

```
cp backend/.env.example backend/.env
```
Note: The default settings in .env.example are compatible with Docker Compose setup.

3. Install Dependencies

```
make install
```

### Running the Application

1. Build and Start:

```
make build
```

2. Access the API

```
http://localhost:3000/api/v1
```

### Useful Commands

Command | Description
--- | ---	
make install | Installs dependencies for root and backend
make build | Rebuilds Docker images and starts containers
make up | Starts containers in detached mode
make down | Stops and removes containers
npm run test | Runs unit tests (inside backend folder)
npm run lint | Checks code style (inside backend folder)
