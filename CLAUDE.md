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
- Single monolithic Flask application (~3,258 lines) with 29+ API routes
- Extensive SQL queries for health data analysis stored in `bd_sistema_aps/Scripts/`

**Frontend:**
- Server-side rendered HTML templates using Jinja2
- Static JavaScript files for client-side interactions
- TailwindCSS for styling with custom theme configuration
- ECharts library for data visualization
- PDF generation using jsPDF for patient invitations and reports

**Database Schema:**
- PostgreSQL database named "esus" 
- Multiple schemas including `sistemaaps` for application tables
- Organized by health programs: Hiperdia, Plafam, adolescents, obesity, prenatal
- Extensive use of views and stored procedures for complex health metrics

### Key Components

**Health Program Modules:**
- **Hiperdia:** Hypertension and diabetes monitoring with action tracking system (types 1-9)
- **Plafam:** Family planning with contraceptive method tracking and age-based filtering
- **Adolescents:** Adolescent healthcare monitoring with timeline-based action tracking
- **Prenatal:** Pregnancy planning and monitoring

**JavaScript Module Structure:**
- `plafam_script.js`: Family planning dashboard with PDF generation for patient invitations
- `adolescentes_script.js`: Adolescent care dashboard with timeline modals and action registration
- `hiperdia_has_script.js`: Hypertension monitoring dashboard
- `hiperdiaApi.js` and `hiperdiaDom.js`: Hypertension API interactions and DOM manipulation

**Data Processing:**
- Complex filtering system with multiple parameters (team, microarea, search, age groups)
- Timeline-based status tracking for patient care continuity
- Safe data conversion utilities for handling numeric health data (`safe_float_conversion` function)
- Action type mapping system for different health program workflows

**PDF Generation System:**
- Patient invitation generation for family planning program
- Different invitation types based on contraceptive method status:
  - Standard invitations for new patients
  - Reminder invitations for patients with overdue methods (<6 months)
  - General contraceptive information for patients with methods overdue >6 months
- Informational materials for parents of adolescents

### Contraceptive Method Status Logic

The system tracks contraceptive method status with specific durations:
- **Pílula/Mensal**: 30 days
- **Trimestral**: 90 days  
- **Implante**: 3 years (1095 days)
- **DIU**: 10 years (3650 days)
- **Laqueadura**: Permanent (Infinity)

Status classifications:
- `em_dia`: Method is current
- `atrasado`: Method overdue up to 6 months
- `atrasado_6_meses`: Method overdue more than 6 months (treated as no method)
- `sem_metodo`: No contraceptive method

### Security Considerations

- Database credentials are hardcoded in `app.py` (lines 34-35) - should be moved to environment variables
- Uses parameterized queries to prevent SQL injection
- PostgreSQL unaccent extension for text search normalization

### File Organization

- `app.py`: Main Flask application with all route handlers (3,258 lines)
- `templates/`: HTML templates for different health program interfaces
- `static/`: JavaScript modules and CSS for frontend functionality
- `bd_sistema_aps/Scripts/`: SQL scripts organized by health program (50+ files)
- `firebase.json`: Firebase hosting configuration for deployment

### Development Notes

The codebase uses Portuguese language throughout (variable names, comments, database fields) as it's designed for Brazilian healthcare system. When working with this code, maintain Portuguese naming conventions for consistency.

The application heavily relies on PostgreSQL-specific features including window functions, lateral joins, and the unaccent extension for text processing.

**Key Global Constants:**
- `TIPO_ACAO_MAP_PY`: Maps action types 1-9 for Hiperdia program workflow
- Action tracking system supports timeline-based patient care management