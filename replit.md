# Rakshith360 - AI Medical Assessment Application

## Overview

Rakshith360 is an AI-powered medical assessment web application that provides symptom analysis, medical specialty recommendations, and hospital location services. Built with React, TypeScript, and Vite, the application leverages multiple AI providers (Google Gemini, DeepSeek, OpenAI) to deliver intelligent medical guidance through an interactive chat interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18.3.1 with TypeScript for type-safe component development
- Vite as the build tool and dev server, configured for optimal performance
- Single-page application (SPA) with client-side routing via react-router-dom

**UI Component Library**
- shadcn/ui components built on Radix UI primitives for accessible, customizable components
- Tailwind CSS for utility-first styling with custom theme configuration
- Dark mode enforced through ThemeContext (application is dark-mode only)

**State Management**
- React Context API for global state (Auth, Theme)
- TanStack Query (React Query) for server state management and caching
- Local component state using React hooks

**Key Features**
- Interactive chat interface with dynamic question flows
- Flash Mode for rapid emergency assessments
- Real-time typing indicators and streaming responses
- Medical specialty recommendations with visual icons
- Hospital location finder with map integration
- Onboarding flow for new users
- Session management with chat history

### Authentication System

**Implementation**
- Custom authentication system using localStorage (no Firebase dependency)
- User credentials stored locally with simple email/password validation
- Session persistence across page refreshes
- Password reset functionality (UI-only, no backend integration)

**User Management**
- User profiles stored in localStorage with medical history and preferences
- Multiple chat sessions per user
- Onboarding completion tracking

### Data Storage

**Client-Side Storage (localStorage)**
- Chat sessions with full message history
- User profiles and preferences
- API keys for AI services (Gemini, DeepSeek, OpenAI, Geoapify)
- Selected AI model preferences
- Onboarding completion status

**Storage Service Architecture**
- Centralized StorageService class (`src/lib/storage.ts`) handles all localStorage operations
- Timeout protection for storage operations (3 second limit)
- JSON serialization for complex objects with Date handling
- User-scoped data keys for multi-user support

### AI Integration

**Multi-Provider Support**
- Google Gemini API (primary) with multiple model options:
  - Gemini 2.5 Pro/Flash (preview)
  - Gemini 2.0 Flash/Flash Lite
  - Gemini 1.5 Pro/Flash/Flash-8B
- DeepSeek API (chat and coder models)
- OpenAI API (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)

**AI Service Architecture** (`src/lib/aiService.ts`)
- Unified `callAIAPI` function abstracts provider-specific implementations
- Model selection and auto-detection for Gemini models
- API key management with localStorage priority over environment variables
- Graceful error handling with user-friendly messages

**Intelligent Model Selection**
- Auto-detection system tests all 7 Gemini models when API key is saved
- Automatically selects the first working model without manual intervention
- Fallback mechanism in callGeminiAPI tries alternative models on 404 errors
- Rate-limit (429) and authentication errors (401/403) surface directly to user
- Progress indicator shows real-time detection status in AccountSettings
- Users can still manually select their preferred Gemini model

**Medical Assessment Flow**
- Dynamic question generation based on symptoms
- Maximum 10 questions per session to prevent fatigue
- Interactive options with custom answer support
- Summary generation with urgency levels
- Specialty recommendations with confidence scores

### Location Services

**Geoapify Integration** (`src/lib/geoapify.ts`)
- Hospital search using Places API
- Geocoding for address-to-coordinates conversion
- Reverse geocoding for coordinates-to-address
- Distance calculation and sorting
- User location detection via browser Geolocation API
- Manual location input fallback

**Hospital Recommendations**
- Specialty-based filtering
- Distance-based sorting
- Rating display when available
- Direct navigation links to Google Maps
- Share functionality for hospital details

### Component Architecture

**Core Components**
- `ChatArea`: Main chat interface with message management
- `FlashMode`: Rapid emergency assessment interface
- `Sidebar`: Navigation, chat history, settings
- `LoginForm`: Authentication interface
- `OnboardingFlow`: Multi-step user onboarding
- `AccountSettings`: API key management and model selection

**Specialized Components**
- `InteractiveMessage`: Dynamic question-answer UI
- `HospitalRecommendations`: Location-based hospital finder
- `MedicalSummaryCard`: Formatted medical assessment display
- `SpecialtyDisplay`/`SpecialtyRecommendation`: Medical specialty visualization

**UI Components** (shadcn/ui)
- Complete component library in `src/components/ui/`
- Includes forms, dialogs, cards, buttons, inputs, etc.
- Fully typed with TypeScript
- Customizable through Tailwind CSS

### Routing

**react-router-dom Configuration**
- `/` - Main chat interface (authenticated users only)
- `/reset-password` - Password reset page
- `*` - 404 Not Found fallback

**Route Protection**
- Authentication check in App.tsx
- Redirect to LoginForm for unauthenticated users
- Loading state during initialization

### Configuration

**Environment Variables**
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `VITE_DEEPSEEK_API_KEY` - DeepSeek API key
- `VITE_OPENAI_API_KEY` - OpenAI API key
- `VITE_GEOAPIFY_API_KEY` - Geoapify location service key

**Build Configuration**
- `vite.config.ts`: Path aliases, dev server settings
- `tailwind.config.ts`: Custom theme, dark mode configuration
- `tsconfig.json`: TypeScript compiler options with strict mode disabled
- `vercel.json`: Deployment configuration for Vercel platform

### Styling System

**Tailwind CSS**
- Custom color palette with CSS variables
- Dark mode as default and only theme
- Responsive breakpoints (sm, md, lg, xl, 2xl)
- Custom animations (accordion, fade, slide)

**CSS Variables** (`src/index.css`)
- Theme colors defined in HSL format
- Separate light/dark mode color schemes (dark enforced)
- Custom properties for components (sidebar, borders, etc.)

## External Dependencies

### AI Services
- **Google Gemini API** - Primary AI model for medical assessments
- **DeepSeek API** - Alternative AI provider
- **OpenAI API** - Alternative AI provider (ChatGPT models)

### Location Services
- **Geoapify API** - Geocoding, reverse geocoding, and places search
- **Browser Geolocation API** - User location detection

### Key NPM Packages
- **React & React DOM** (18.3.1) - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack React Query** - Server state management
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form state management
- **Radix UI** - Headless UI components
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **date-fns** - Date manipulation
- **class-variance-authority** - Component variant management
- **clsx** & **tailwind-merge** - Conditional className utilities

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **TypeScript ESLint** - TypeScript-specific linting rules

### Deployment
- **Vercel** - Hosting platform (configured via `vercel.json`)
- Static site deployment with SPA routing support
- Asset caching with long-term cache headers