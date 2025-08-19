# Overview

LeanTechnovAtions is a comprehensive online assessment platform that enables administrators to create, manage, and distribute assessments. The application provides functionality for creating multiple-choice questions, inviting respondents via email, tracking submissions, and analyzing results. It features a modern web interface with dashboard analytics, assessment management tools, and real-time result tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based architecture
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Styling**: Tailwind CSS with custom design system variables for consistent theming
- **UI Components**: Radix UI primitives with shadcn/ui component library for accessibility and consistency
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Storage Pattern**: Interface-based storage abstraction with in-memory implementation
- **API Design**: RESTful endpoints organized by resource (assessments, submissions, invitations, users)
- **Validation**: Zod schemas for request/response validation and type generation
- **Development**: Vite for development server with hot module replacement

## Data Layer
- **Database**: SQLite with Drizzle ORM for type-safe database operations  
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Connection**: Local SQLite file-based database for development
- **Data Modeling**: Relational schema with users, assessments, questions, submissions, and invitations tables
- **Type Generation**: Automatic TypeScript types from database schema using drizzle-zod
- **JSON Storage**: Options, answers, and email arrays stored as JSON strings in SQLite text fields

## Authentication & Session Management
- **Session Storage**: PostgreSQL-based sessions using connect-pg-simple
- **User Management**: Role-based access with admin users for assessment management
- **Security**: Express middleware for request logging and error handling

## Development & Deployment
- **Build System**: Vite for frontend bundling with esbuild for server-side bundling
- **Development Environment**: Integrated development with Replit-specific plugins and error handling
- **Code Quality**: TypeScript strict mode with path mapping for clean imports
- **Asset Management**: Vite-based asset pipeline with custom alias configuration

# External Dependencies

## Database Services
- **SQLite**: Local file-based SQL database for development
- **better-sqlite3**: Node.js SQLite driver for high performance
- **Drizzle ORM**: TypeScript ORM for database operations and migrations

## UI & Styling
- **Radix UI**: Accessible React component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: Pre-built component library based on Radix UI primitives
- **Lucide React**: SVG icon library for consistent iconography

## Development Tools
- **Vite**: Frontend build tool and development server
- **TanStack React Query**: Data fetching and state management library
- **React Hook Form**: Form state management and validation
- **Zod**: TypeScript-first schema validation library
- **date-fns**: Date utility library for formatting and manipulation

## Routing & Navigation
- **Wouter**: Lightweight React router for client-side navigation

## Development Environment
- **Replit Integration**: Development environment plugins for runtime error handling and development banner

# Recent Changes (August 6, 2025)

## Database Migration & Persistence Fix (Latest - August 6, 2025)
- **CRITICAL FIX**: Replaced in-memory storage with persistent SQLite database
- Dashboard now correctly updates and shows data across server restarts
- Implemented full SQLiteStorage class with proper database operations
- Fixed data persistence issues - assessments, submissions, and invitations now saved permanently
- Created database.db file with proper table structure matching schema

## Previous Database Work
- Migrated from PostgreSQL to SQLite for simplified local development
- Updated schema to use SQLite-compatible data types (text, integer, blob)
- Implemented JSON serialization for complex data types (options, answers, emails)
- Modified storage layer to handle JSON string conversion for arrays and objects

## UI/UX Improvements
- Updated color scheme to match LeanTechnovAtion brand identity
- Enhanced golden yellow primary color (hsl(45, 93%, 47%)) to match logo
- Improved dark text contrast (hsl(210, 11%, 15%)) for better readability
- Refined background colors for cleaner, more professional appearance
- Applied consistent design tokens throughout the application

## Technical Enhancements
- Fixed all TypeScript LSP diagnostics for type safety
- Improved error handling in form submissions and API calls
- Enhanced component rendering with proper null checks
- Optimized storage interface for SQLite compatibility

## Email System Integration & Security Updates (Latest Update)
- Successfully integrated Gmail SMTP service for real email delivery
- Built professional HTML email templates with LeanTechnovAtion branding
- Fixed assessment URL routing to use correct `/take/:id` format
- Implemented comprehensive email logging and error handling
- Confirmed live email delivery with message ID tracking

## Security & Assessment Enhancements (August 6, 2025)
- Created restricted public assessment interface (/take/:id) with no admin navigation
- **FIXED**: Question text now displays properly to respondents (was showing only options)
- Fixed scoring algorithm to properly compare user answers with correct options
- Added time tracking and countdown timer functionality for timed assessments
- Implemented auto-submission when time limit is reached
- Enhanced answer parsing to handle both array and object option formats
- Added comprehensive error handling for malformed question data
- Resolved React hook initialization errors in public assessment component