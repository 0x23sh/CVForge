# CVForge — Product Requirements Document

## Original problem statement
AI CV generator (French): user enters info, picks a target job, receives an AI-optimized ATS-friendly CV. Free=1 CV, Premium=9.99€ unlimited + premium templates. Stripe payment, PDF export.

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT auth (bcrypt). GPT-5.2 via emergentintegrations. Stripe via emergentintegrations. PDF via reportlab.
- Frontend: React 19 + Tailwind + Shadcn UI. Outfit + IBM Plex Sans fonts. Klein Blue (#002FA7) accent.

## User personas
- Job seekers (FR-speaking) wanting fast, ATS-friendly CVs without hiring a coach.

## Core requirements (static)
- Multi-step CV builder
- AI optimization (rewrites + ATS keywords + ats_score 0-100)
- 4 templates (minimal, modern free / executive, elegant premium)
- PDF export
- Free 1 CV / Premium unlimited
- Stripe checkout 9.99€ one-time

## Implemented (2026-02)
- JWT auth (register/login/me) — /api/auth/*
- CV CRUD: /api/cv/generate, /list, /{id} GET/DELETE, /{id}/template PUT, /{id}/pdf
- /api/templates listing
- Stripe: /api/payments/checkout/session, /api/payments/checkout/status/{id}, /api/webhook/stripe
- Frontend pages: Landing, Login, Register, Dashboard, CV Builder (5 steps), CV Preview, Pricing, Payment Success (with polling)
- Free tier limit (1 CV) + premium template gating
- ATS score visualisation
- Backend deployment health check passed

## Backlog
- P1: Annual subscription / coupon codes
- P1: Cover letter generator
- P1: LinkedIn import
- P2: Multi-language UI (EN, ES)
- P2: Real-time collaboration / share link
- P2: Job-description paste → match score

## Next tasks
- Run end-to-end testing post-deploy
- Add onboarding tooltip on first CV creation
