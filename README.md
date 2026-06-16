# Azaman Business Portal

A clean, dark-themed web portal for Azaman business owners to manage products, orders, and KYB verification.

## Stack
- React 18 + Vite
- Tailwind CSS (same design tokens as admin portal)
- TanStack Query for data fetching
- React Router v6
- Sonner for toasts

## Pages
| Route | Description |
|-------|-------------|
| `/login` | Email + password sign-in |
| `/onboarding` | First-time business registration (2 steps) |
| `/` | Dashboard with stats + recent orders |
| `/orders` | Full order list with status filters |
| `/orders/:id` | Order detail + mark as delivered |
| `/products` | Product catalogue — create, edit, toggle active |
| `/kyb` | Business verification document upload |
| `/settings` | Edit business profile |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set VITE_API_URL to your Azaman backend

# 3. Run dev server
npm run dev

# 4. Build for production
npm run build
```

## Deployment (Render)
1. New Static Site → connect your repo
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

## Auth
Uses the same `/api/auth/login` endpoint as the Azaman app. JWT stored in `localStorage` under key `biz_token`. Auto-redirects to `/login` on 401.
