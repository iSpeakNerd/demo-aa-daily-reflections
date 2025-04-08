# Schema

## Project Overview

AA Daily Reflections is a serverless application built using Netlify Functions, Supabase (PostgreSQL), and Discord integration. The application manages and distributes daily reflections from an external API through Discord.

## Architecture Overview

### Core Directories

```ascii
.                                  # Root
├── _types/                        # type definitions used throughout project
│ ├── db.types.ts                  # Auto-generated types from Supabase schema
│ └── discord.types.ts             # definitions for Discord-related interfaces
|
├── .netlify/                      # Netlify configuration and build artifacts
├── functions/                     # Netlify serverless functions directory
│ ├── reflection.ts                # Handles daily reflection distribution on Cron schedule
│ ├── discord-webhook.ts           # Processes Discord webhook events and interactions
│ ├── scheduled-ping.js            # Keeps application alive with periodic pings
│ └── scheduled-bot.ts             # Manages scheduled Discord bot tasks
|
├── utils/                         # Shared utility functions and helpers
│ ├── errors.ts                    # Centralized error handling and custom error types
│ ├── supabase.ts                  # Supabase client config and database operations
│ ├── external-reflections.ts      # Data fetching utilities and operations from external api
│ ├── discord-reflections.ts       # Discord-specific reflection formatting and handling
│ ├── strings.ts                   # String constants and text utilities
│ └── deploy-commands.js           # Script for deploying Discord slash commands
|
├── tests/                         # Test files and test utilities
├── logs/                          # Application logs directory
├── README.md                      # Project documentation and setup instructions
└── project-schema.md              # schema for ai code gen
```

### 1. Infrastructure

- **Hosting Platform**: Netlify
- **Database**: Supabase (PostgreSQL)
- **Runtime**: Node.js with TypeScript
- **Package Manager**: pnpm

### 1b. Configuration

- `tsconfig.json`: TypeScript compiler config
- `.prettierrc`: Prettier settings
- `netlify.toml`: Netlify build + deploy config

### 2. Core Components

#### 2.1 Serverless Functions (`/functions`)

- **reflection.ts**: Handles scheduled reflection distribution with random delay up to 8 seconds
- **discord-webhook.ts**: Manages Discord webhook interactions (user interactions)
- **scheduled-ping.js**: Implements ping functionality
- **scheduled-bot.ts**: Bot-related scheduled tasks

#### 2.2 Utility Layer (`/utils`)

- **supabase.ts**: Database client and operations
- **db.types.ts**: Generated TypeScript types for database schema
- **errors.ts**: Error handling and management
- **external-reflections.ts**: Data retrieval utilities
- **discord-reflections.ts**: Discord-specific reflection handling
- **strings.ts**: String constants and utilities
- **deploy-commands.js**: Discord command deployment

### 3. Key Architectural Patterns

#### 3.1 Type Safety

- Strong TypeScript integration throughout the codebase
- Generated Supabase types ensure database type safety
- Custom type definitions for Discord interactions (`discord.types.ts`)

#### 3.2 Modular Design

- Clear separation of concerns between functions and utilities
- Dedicated error handling module
- Centralized database operations

#### 3.3 Configuration Management

- Environment variables via `.env`
- Netlify configuration via `netlify.toml`
- TypeScript configuration in `tsconfig.json`

### 4. Integration Points

#### 4.1 Discord Integration

- Webhook-based communication
- Command system implementation
- Bot functionality for automated tasks

#### 4.2 Database Integration

- Supabase client configuration
- Type-safe database operations
- Generated type definitions

## Architectural Decisions and Reasoning

### 1. Serverless Architecture (Netlify Functions)

**Decision**: Use of [Netlify Functions](https://docs.netlify.com/cli/manage-functions/#invoke-functions-while-running-netlify-dev) for serverless deployment  
**Reasoning**:

- Reduced operational complexity
- Cost-effective scaling
- Integration with version control
- Automatic deployments

### 2. Supabase as Database

**Decision**: Use of Supabase with generated types  
**Reasoning**:

- Type-safe database operations
- PostgreSQL compatibility
- Built-in authentication and authorization
- Real-time capabilities if needed

### 3. TypeScript Implementation

**Decision**: Full TypeScript adoption  
**Reasoning**:

- Enhanced code reliability
- Better developer experience
- Improved maintainability
- Static type checking

### 4. Modular Code Structure

**Decision**: Clear separation between functions and utilities  
**Reasoning**:

- Improved code organization
- Better testability
- Easier maintenance
- Reusable components

### 5. Error Handling Strategy

**Decision**: Centralized error handling module  
**Reasoning**:

- Consistent error management
- Easier debugging
- Better error tracking
- Standardized error responses

### Testing Strategy

#### Tests Organization

- **Test Scripts Location**: Test scripts are stored in the
  `/tests` directory. To facilitate testing with Netlify
  functions, application end-to-end test files should be moved to the `/
functions` directory. This allows them to be invoked as
  serverless functions during local and remote testing.
- **Example Test Files**:
  - `test-reflection.ts`: A test function that fetches a
    daily reflection for a given date and posts it to
    Discord, simulating the behavior of the
    `scheduled-reflection` function.

#### Unit Tests

Other test files (e.g., `bb-url.test.ts`, `discord-bot.
  test.ts`, etc.) contain unit tests for specific utility
functions and components.

#### End-to-End Testing with Netlify Functions

- **Overview**: The application utilizes Netlify Functions
  to perform end-to-end tests, ensuring that the entire flow
  of fetching and posting daily reflections works as
  expected. This approach allows for testing the integration
  of various components in a serverless environment.

#### Testing Approach

- **Invocation**: Tests can be invoked using the Netlify
  CLI, allowing for execution of serverless functions in a
  local or deployed environment. This simulates real-world
  usage and ensures that all components interact correctly.
- **Error Handling**: Each test function includes error
  handling to capture and log any issues that arise during
  execution, providing insights into failures and
  facilitating debugging.

## Code Conventions

### 1. Formatting

- Single quotes for strings
- Trailing commas enabled
- Semicolons required
- Prettier for consistent formatting

### 2. File Organization

- Function-specific code in `/functions`
- Shared utilities in `/utils`
- Type definitions in dedicated files
- Clear separation of concerns

### 3. Naming Conventions

- Kebab-case for file names
- TypeScript interfaces and types present
- Clear, descriptive function names
- Consistent module naming

## Development Workflow

- Local development via `pnpm dev` script
- TypeScript compilation
- Automated type generation for Supabase
- Prettier for code formatting
