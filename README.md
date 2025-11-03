# RSS Developer Suite

A comprehensive toolkit for RSS developers and publishers to test, validate, and optimize their feeds.

## Features

1. **RSS Spec & Linter Docs** - Interactive specification documentation with live linting for RSS, Atom, and JSON Feed formats
2. **Feed Preview Sandbox** - Preview how your feed looks across multiple reader templates (Google Reader, Apple News, Minimalist, Classic)
3. **HTTP Caching Tester** - Test ETag/Last-Modified headers and conditional GET behavior to ensure proper caching
4. **Alt/Text Enforcer** - Check and fix missing alt-text in images and enclosures for better accessibility
5. **Robots/Headers Lab** - Test robots.txt rules, CORS headers, and simulate how different clients access your feed
6. **WebSub Hub Tester** - Verify and debug WebSub (PubSubHubbub) publisher/subscriber flows

## Project Structure

This is a monorepo containing:
- `frontend/` - Next.js 14+ application
- `backend/` - Express API server
- `shared/` - Shared TypeScript types

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Development

```bash
# Install dependencies
npm install

# Run frontend and backend concurrently
npm run dev

# Build for production
npm run build

# Run only frontend (development)
cd frontend && npm run dev

# Run only backend (development)
cd backend && npm run dev
```

## Configuration

### Backend

Create a `.env` file in the `backend/` directory:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Backend**: Node.js, Express, TypeScript
- **Architecture**: Stateless (no database required)
- **Libraries**:
  - `rss-parser` - Feed parsing
  - `fast-xml-parser` - XML parsing
  - `cheerio` - HTML parsing
  - `robots-parser` - robots.txt parsing
  - `ws` - WebSocket support

## API Endpoints

- `POST /api/parse` - Parse a feed
- `POST /api/validate` - Validate and lint a feed
- `POST /api/preview` - Get feed preview data
- `POST /api/cache-test` - Test HTTP caching
- `POST /api/accessibility` - Check accessibility (with `fix: true` to generate fixed feed)
- `POST /api/robots-test` - Test robots.txt and CORS headers
- `POST /api/websub-test` - Discover and test WebSub hub
- `GET /api/websub/verify` - WebSub verification endpoint
- `POST /api/websub/notify` - WebSub notification endpoint

## Usage

1. **RSS Spec & Linter**: Enter a feed URL to see validation results and specification documentation
2. **Preview Sandbox**: Enter a feed URL and choose a template to preview
3. **Cache Tester**: Test your feed's HTTP caching configuration
4. **Accessibility**: Check for missing alt-text and generate a fixed feed
5. **Robots Lab**: Test robots.txt rules and CORS configuration
6. **WebSub Tester**: Discover WebSub hubs and test subscription flows

## Architecture

- **Stateless**: No database required - all processing is done in real-time
- **Monorepo**: Single repository for frontend, backend, and shared code
- **TypeScript**: Full type safety across the stack
- **Error Handling**: Comprehensive error handling in all services

## License

ISC
