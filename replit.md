# Wedding Website with Photo Quest

## Overview

This is a wedding website application for Marcela and Zbyněk's wedding on October 11, 2025. The website features a romantic design with a wedding countdown timer, photo sharing capabilities, and a gamified "Photo Quest" system where guests can complete photography challenges. The application includes a photo gallery where guests can upload images, like photos from other guests, and track their progress through various wedding-related photo challenges.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Users**: Authentication with username/password
- **Quest Challenges**: Photography challenges with points, target photo counts, and active status
- **Uploaded Photos**: Photo metadata with uploader information, quest association, and like counts
- **Photo Likes**: Voting system linking photos to voter names
- **Quest Progress**: Tracks participant progress through challenges with completion status

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **User Context**: Name-based identification system for wedding guests
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