 You are in a git repository, create a monorepo structure (single repo, multiple apps) using next js and nest js. below is the PRD.md file.

# PRD.md

# AI SaaS Architect -- MVP (Local Development Version)

------------------------------------------------------------------------

## 1. Product Overview

**Product Name:** AI SaaS Architect\
**Version:** MVP (v0.1 -- Local Only)\
**Goal:** Generate structured SaaS architecture blueprint from user
input.

This tool helps developers and SaaS founders quickly design:

-   Feature list
-   Role-permission matrix
-   Database schema
-   Folder structure
-   Deployment suggestion

Target users: - Indie hackers - SaaS founders - Backend developers -
Technical product managers

This MVP runs completely locally: - Local Next.js app - Local database -
No cloud deployment - No Supabase - No external hosting strategy
included

Target Users: - Developers - SaaS founders - Backend engineers -
Technical architects

------------------------------------------------------------------------

## 2. Problem Statement

Developers struggle with:

-   Designing multi-tenant systems
-   Structuring RBAC properly
-   Defining normalized DB schema
-   Planning backend structure
-   Avoiding architecture mistakes early

Current behavior: - Random AI prompts - Blog reading - YouTube
tutorials - Trial-and-error schema design

No structured workflow.

------------------------------------------------------------------------

## 3. MVP Scope (Strict 6-Hour Build)

### Core Feature

User submits SaaS idea → System generates structured architecture
blueprint.

Constraints: - Runs locally only - Uses local database (PostgreSQL or
SQLite) - No authentication required - No deployment strategy included

------------------------------------------------------------------------

## 4. User Flow

1.  User runs app locally
2.  Opens http://localhost:3000
3.  Fills architecture form
4.  Clicks "Generate Architecture"
5.  System calls OpenAI API
6.  Structured output is saved in local DB
7.  Result page displays formatted blueprint

------------------------------------------------------------------------

## 5. Pages

### 5.1 Home Page (/)

Purpose: Collect architecture inputs

Sections: - Product Title - Short Description - Architecture Input
Form - Generate Button

------------------------------------------------------------------------

### 5.2 Result Page (/result/\[id\])

Purpose: Display structured AI output

Sections: - Project Summary - MVP Features - Future Features - Role &
Permission Matrix - Database Schema Tables - Suggested Folder Structure

Each section must include: - Copy button - Clean formatting

------------------------------------------------------------------------

### 5.3 History Page (/history) (Optional)

Purpose: - List previous generations - Click to view saved architecture

------------------------------------------------------------------------

## 6. Form Specification

### Required Fields

1.  App Idea
    -   Type: Textarea
    -   Required: Yes
    -   Minimum length: 30 characters
2.  User Roles
    -   Type: Comma-separated input
    -   Required: Yes
    -   Minimum 1 role
3.  Monetization Type
    -   Type: Dropdown
    -   Options:
        -   Subscription
        -   One-time
        -   Freemium
        -   Marketplace
        -   Internal Tool
4.  Tenant Type
    -   Type: Radio
    -   Options:
        -   Single Tenant
        -   Multi-Tenant
5.  Tech Stack
    -   Type: Multi-select
    -   Examples:
        -   Next.js
        -   NestJS
        -   Rails
        -   PostgreSQL
        -   MySQL
        -   Prisma

------------------------------------------------------------------------

## 7. AI Output Specification (Strict JSON)

AI must return valid JSON in this format:

{ "project_summary": "","mvp_features": \[\], "future_features": \[\],
"roles": \[ { "name": "","description": "","permissions": \[\] } \],
"database_schema": \[ { "table_name": "","columns": \[ { "name":
"","type": "","description": "" } \] } \], "folder_structure": {
"frontend": \[\], "backend": \[\] } }

No deployment strategy included.

------------------------------------------------------------------------

## 8. Database Design (Local Only)

Use local PostgreSQL or SQLite.

### Table: generations

  Column              Type        Description
  ------------------- ----------- ------------------------
  id                  UUID        Primary key
  idea                TEXT        User input
  roles_input         TEXT        Raw roles
  monetization_type   VARCHAR     Selected option
  tenant_type         VARCHAR     Single/Multi
  tech_stack          JSON        Selected stack
  ai_response         JSON        Structured AI response
  created_at          TIMESTAMP   Auto timestamp

------------------------------------------------------------------------

## 9. Backend API Design

### POST /api/generate

Request: { idea: string, roles: string\[\], monetization: string,
tenantType: string, techStack: string\[\] }

Flow: 1. Validate input 2. Call OpenAI API 3. Validate JSON response 4.
Save to local DB 5. Return ID + structured data

Response: { id: UUID, data: JSON }

------------------------------------------------------------------------

### GET /api/generation/:id

Returns stored generation from local database.

------------------------------------------------------------------------

## 10. Local Environment Setup

Required: - Node.js - Local PostgreSQL or SQLite - .env file

Example .env:

OPENAI_API_KEY=your_key
DATABASE_URL=postgresql://user:password@localhost:5432/ai_architect

------------------------------------------------------------------------

## 11. Non-Functional Requirements

-   Response time \< 20 seconds
-   Strict JSON validation
-   Graceful error handling
-   No external dependencies except OpenAI

------------------------------------------------------------------------

## 12. Tech Stack (Local Only)

Frontend: - Next.js (App Router) - Tailwind CSS

Backend: - Next.js API routes

Database: - Local PostgreSQL OR SQLite - Prisma ORM

------------------------------------------------------------------------

## 13. Out of Scope

-   Deployment strategy
-   Supabase
-   Cloud hosting
-   Payment integration
-   Authentication
-   CI/CD setup
-   Repo generation

------------------------------------------------------------------------

## 14. Success Criteria

-   App runs locally without errors
-   Architecture generated successfully
-   Data stored in local database
-   JSON structured correctly
-   Clean UI rendering

------------------------------------------------------------------------

End of PRD (Local Development Version)
