# Wedding Website with Photo Quest

## Overview

This is a wedding website application for Marcela and Zbyněk's wedding on October 11, 2025. The website features a romantic design with a wedding countdown timer, photo sharing capabilities, and a gamified "Photo Quest" system where guests can complete photography challenges. The application includes a photo gallery where guests can upload images, like photos from other guests, and track their progress through various wedding-related photo challenges. Advanced AI verification using Google Gemini ensures that uploaded photos match challenge requirements automatically.

**Recently Added**: Replit Authentication system with protected routes, landing page for unauthenticated users, and user profile integration in the navigation.

## User Preferences

Preferred communication style: Simple, everyday language.
Prefers Czech language interface.
Wants individual pages for photo challenges instead of modal dialogs.
Authenticated user information should be used instead of manual name entry.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight React router)
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom wedding-themed color palette and romantic design elements
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Pattern**: RESTful API endpoints under `/api` prefix
- **File Uploads**: Multer middleware for handling photo uploads with file type validation
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Hot module replacement via Vite integration in development mode

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Defined database tables for users, quest challenges, uploaded photos, photo likes, and quest progress tracking
- **Migrations**: Drizzle Kit for database schema migrations
- **Connection**: Neon Database serverless PostgreSQL connection
- **Storage Interface**: Abstracted storage layer with in-memory fallback for development

### Database Schema Design
- **Users**: Replit user profiles with ID, email, first/last name, and profile image URL
- **Sessions**: Express session storage for authentication state management
- **Quest Challenges**: Photography challenges with points, target photo counts, and active status
- **Uploaded Photos**: Photo metadata with uploader information, quest association, and like counts
- **Photo Likes**: Voting system linking photos to voter names
- **Quest Progress**: Tracks participant progress through challenges with completion status

### Authentication and Authorization
- **Replit Auth**: OpenID Connect authentication via Replit OAuth provider
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **User Data**: Profile information from Replit (ID, email, name, profile image)
- **Route Protection**: Authentication middleware protecting API endpoints and pages
- **Database Integration**: User profiles stored in PostgreSQL with automatic upsert on login
- **File Security**: Upload validation for image file types (JPEG, PNG, HEIC) with size limits

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

### UI and Styling
- **Shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible, unstyled UI primitives for React
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for UI components

### Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment plugins for cartographer and error overlay

### File Upload and Processing
- **Multer**: Express middleware for handling multipart/form-data file uploads
- **File System**: Local file storage in uploads directory with automatic directory creation

### External Fonts and Assets
- **Google Fonts**: Custom font families (Playfair Display, Dancing Script, Inter)
- **Unsplash**: Stock photography for romantic wedding imagery
- **Custom CSS Variables**: Romantic color scheme with heart decorations and animations

## Recent Improvements (August 2025)

### December 2025 Updates
- **Removed Manual Name Input**: Eliminated "Vaše jméno" fields since users are authenticated via Google account
- **Individual Challenge Pages**: Converted modular dialog windows to dedicated pages for each photo challenge
- **Improved Navigation**: Added `/challenge/:id` routes for direct access to specific challenges  
- **Enhanced User Experience**: Streamlined photo upload process using authenticated user information
- **Updated Photo Gallery**: Removed voter name input, uses authenticated user email for likes

## Earlier Improvements (August 2025)

### Performance Optimizations
- **Loading States**: Added loading spinners and skeleton states throughout the application
- **Page Transitions**: Smooth fade-in/fade-out transitions between routes using custom PageTransition component
- **Image Optimization**: Lazy loading with intersection observer, optimized image components with fallbacks
- **Query Caching**: Enhanced TanStack Query configuration with 5-minute stale time and 10-minute garbage collection
- **Database Optimization**: Improved query patterns and caching strategies

### Progressive Web App (PWA) Features
- **Offline Support**: Service worker implementation for caching static assets and API responses
- **App Manifest**: Full PWA configuration with custom icons, shortcuts, and standalone display mode
- **Installation Prompt**: Native app-like experience with install prompts on mobile and desktop
- **Push Notifications**: Foundation for real-time wedding day updates

### Enhanced UI Components
- **Glassmorphism Design**: Implemented modern glass button design system with translucent effects
- **Optimized Images**: Smart image loading with lazy loading, blur effects, and error handling
- **Wedding Timeline**: Live updating timeline component showing real-time wedding day progress
- **Improved Accessibility**: Better contrast ratios and keyboard navigation

### Real-time Features
- **Live Timeline Updates**: Wedding day timeline shows current events with live status indicators
- **Smart Caching**: Intelligent cache invalidation for real-time data updates
- **Performance Monitoring**: Enhanced error handling and loading state management

### Technical Architecture Updates
- **Component Optimization**: Reduced bundle size through better component structure
- **Type Safety**: Enhanced TypeScript integration with better type definitions
- **Error Boundaries**: Improved error handling and user feedback systems
- **Code Splitting**: Optimized loading through better component organization