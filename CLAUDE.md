# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start the application:**
```bash
python app.py
```
The Flask application runs on port 3030 with debug mode enabled and listens on all interfaces (0.0.0.0).

**Lint JavaScript:**
```bash
npx eslint static/*.js
```

## Architecture Overview

This is a Flask-based healthcare management system (Sistema APS) for primary care services in Brazil. The application manages multiple health programs including family planning (Plafam), hypertension/diabetes monitoring (Hiperdia), and adolescent care.

### Core Architecture

**Backend:**
- Flask web framework with PostgreSQL database (port 5433)
- Database connection configuration in `app.py` lines 31-45
- 29+ API routes handling different health program workflows
- Extensive SQL queries for health data analysis stored in `bd_sistema_aps/Scripts/`

**Frontend:**
- Server-side rendered HTML templates using Jinja2
- Static JavaScript files for client-side interactions
- TailwindCSS for styling with custom theme configuration
- ECharts library for data visualization

**Database Schema:**
- PostgreSQL database named "esus" 
- Multiple schemas including `sistemaaps` for application tables
- Organized by health programs: Hiperdia, Plafam, adolescents, obesity, prenatal
- Extensive use of views and stored procedures for complex health metrics

### Key Components

**Health Program Modules:**
- **Hiperdia:** Hypertension and diabetes monitoring with action tracking system (types 1-9)
- **Plafam:** Family planning with contraceptive method tracking and age-based filtering
- **Adolescents:** Adolescent healthcare monitoring
- **Prenatal:** Pregnancy planning and monitoring

**Data Processing:**
- Complex filtering system with multiple parameters (team, microarea, search, age groups)
- Timeline-based status tracking for patient care continuity
- Safe data conversion utilities for handling numeric health data

**Security Considerations:**
- Database credentials are hardcoded in `app.py` (lines 34-35) - should be moved to environment variables
- Uses parameterized queries to prevent SQL injection
- PostgreSQL unaccent extension for text search normalization

### File Organization

- `app.py`: Main Flask application with all route handlers
- `templates/`: HTML templates for different health program interfaces
- `static/`: JavaScript modules and CSS for frontend functionality
- `bd_sistema_aps/Scripts/`: SQL scripts organized by health program
- `firebase.json`: Firebase hosting configuration for deployment

### Development Notes

The codebase uses Portuguese language throughout (variable names, comments, database fields) as it's designed for Brazilian healthcare system. When working with this code, maintain Portuguese naming conventions for consistency.

The application heavily relies on PostgreSQL-specific features including window functions, lateral joins, and the unaccent extension for text processing.