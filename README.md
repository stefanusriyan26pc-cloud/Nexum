<div align="center">
<h1 style="font-size: 2.5em; margin-bottom: 10px;">⚡ Nexus</h1>
<p style="font-size: 1.1em; color: #A3A3A3; margin-bottom: 20px;">A powerful personal management and productivity tool</p>
</div>

---

## 🚀 Overview

**Nexus** is a fully-featured personal management application designed to streamline your workflow. Built with modern technologies including React, TypeScript, Tailwind CSS, and Vite, it provides a sleek, performant interface for managing tasks, projects, calendars, and analytics.

### Key Features

- 📋 **Tasks Management**: Organize tasks with Kanban and list views
- 📁 **Projects**: Track multiple projects with progress indicators
- 📅 **Calendar**: Schedule events and manage your calendar
- 📊 **Analytics**: View productivity metrics and insights
- ⚙️ **Settings**: Customize your experience
- 🎨 **Design System**: Comprehensive UI component library

---

## 📋 Prerequisites

- **Node.js** v18+ (LTS recommended)
- **pnpm** v8+ (or npm/yarn as alternatives)

---

## 🏃 Quick Start

### Installation

```bash
# Clone or open the project
cd nexus-personal-management-tool

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Supabase URL + Service Role Key (see Supabase setup below)
```

### Supabase Setup (Required for Data Persistence)

The backend uses **Supabase** for database and authentication. Follow these steps:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. In **SQL Editor**, run the migration:

```sql
-- Run both migrations in order:
-- 1. supabase/migrations/20250302000001_initial_schema.sql
-- 2. supabase/migrations/20250302000002_transactions_profiles.sql
```

4. Add to your `.env`:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

> **Note:** Without Supabase configured, the API returns empty data. The app falls back to localStorage for offline/demo mode.

### Development

```bash
# Start development server with hot reload
pnpm dev

# The app will be available at http://localhost:3000
```

### Production Build

```bash
# Build optimized production bundle
pnpm build

# Preview production build locally
pnpm preview

# Clean build artifacts
pnpm clean
```

---

## 🏗️ Project Architecture

```
nexus/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── ui/           # Base component library
│   ├── layouts/          # Layout components (App, Auth)
│   ├── pages/            # Page components (lazy loaded)
│   │   └── auth/         # Authentication pages
│   ├── App.tsx           # Root app component with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles with Tailwind
├── server.ts             # Express dev server with API
├── vite.config.ts        # Vite configuration
├── index.html            # HTML template
└── package.json          # Project dependencies & scripts
```

---

## 🎨 Design System

The app includes a comprehensive dark-mode design system with:

- **Color Palette**: Carefully curated dark theme with high contrast
- **Typography**: Inter (body) and Space Grotesk (headers)
- **Components**: 9 essential UI components with variants
- **Animations**: Smooth transitions and loading states
- **Accessibility**: WCAG compliant focus ring and states

Access the design system page at `/design-system` in the app.

---

## 📦 Build Optimization

The production build is optimized with:

- **Code Splitting**: Lazy-loaded pages for better performance
- **Manual Chunking**: Vendor, UI, and utility chunks separated
- **Tree Shaking**: Removes unused code
- **Asset Optimization**: Minified CSS and JavaScript
- **Gzip Compression**: Reduced file sizes

**Build Output:**
- Total Size: ~751 KB (gzipped: ~244 KB)
- Optimal for modern browsers

---

## 🔌 API Integration

The backend is integrated with **Supabase** for persistence. API routes:

```
GET    /api/projects         # List projects
POST   /api/projects         # Create project
PUT    /api/projects/:id     # Update project
DELETE /api/projects/:id     # Delete project

GET    /api/tasks            # List tasks
POST   /api/tasks            # Create task
PUT    /api/tasks/:id        # Update task
DELETE /api/tasks/:id        # Delete task

GET    /api/events           # List events
POST   /api/events           # Create event
PUT    /api/events/:id       # Update event
DELETE /api/events/:id       # Delete event

GET    /api/analytics        # Task analytics
GET    /api/exchange-rates   # IDR exchange rates

POST   /api/auth/login       # Supabase auth login
POST   /api/auth/register    # Supabase auth register
POST   /api/auth/logout      # Sign out
GET    /api/auth/session     # Current session
```

---

## 🛡️ Production Readiness

### Features Included

✅ **Error Boundaries**: Graceful error handling with fallback UI
✅ **Loading States**: Suspense-based lazy loading with spinners
✅ **Responsive Design**: Mobile-first, works on all screen sizes
✅ **Accessibility**: Semantic HTML, focus management, ARIA labels
✅ **Performance**: Code splitting, route lazy loading, optimized assets
✅ **SEO**: Meta tags, proper titles, Open Graph support
✅ **Security**: CSP-ready, no inline scripts, proper sanitization

### Deployment Checklist

- [ ] Update `.env.local` with production API key
- [ ] Set `GEMINI_API_KEY` environment variable
- [ ] Run `pnpm lint` for TypeScript validation
- [ ] Run `pnpm build` for production bundle
- [ ] Test with `pnpm preview`
- [ ] Set up proper caching headers
- [ ] Enable gzip compression on server
- [ ] Configure CORS if API is separate
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Monitor Core Web Vitals

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Latest 2 versions |
| Firefox | ✅ Latest 2 versions |
| Safari | ✅ Latest 2 versions |
| Edge | ✅ Latest 2 versions |

---

## 🔧 Development Tools

- **TypeScript**: Full type safety
- **Vite**: Lightning-fast build tool
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Lucide React**: Modern icon library
- **Recharts**: Data visualization
- **Date-fns**: Date utilities

---

## 📝 Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# App
NODE_ENV=development
PORT=3000
APP_URL="http://localhost:3000"

# Supabase (required for backend)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI (optional)
GEMINI_API_KEY=your_gemini_api_key

# Security
CORS_ORIGINS="http://localhost:3000"
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# MacOS/Linux: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Windows: Use netstat and taskkill
```

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Font Loading Issues
Check the browser console and ensure fonts are loading from googleapis.com

---

## 📄 License

Licensed under the Apache License 2.0. See LICENSE file for details.

---

## 🤝 Support

For issues or feature requests, please open an issue or contact the development team.

**Happy productivity! 🚀**
