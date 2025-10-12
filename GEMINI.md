# GEMINI.md - Sistema APS

## Project Overview

This is the **Sistema APS (Atenção Primária à Saúde)**, a web-based management system designed for primary healthcare units in Brazil. The application provides dashboards and tools to manage various public health programs, including:

*   **HIPERDIA:** Monitoring of hypertension and diabetes.
*   **PLAFAM:** Family planning and contraceptive methods.
*   **Adolescent Health:** Healthcare for adolescents.
*   **Prenatal Care:** Monitoring pregnant women.
*   **Obesity:** Obesity control and monitoring.

The system is built with a **Python Flask** backend that serves a REST API and renders HTML templates. The frontend is built with **JavaScript (ES6+)** and styled with **TailwindCSS**. Data visualization is handled by **ECharts**, and PDF generation is done with **jsPDF** and **ReportLab**. The database is **PostgreSQL**.

## Building and Running

**Backend (Flask):**

1.  **Install Dependencies:** The project uses Python. Install the required packages using pip:
    ```bash
    # It's recommended to use a virtual environment
    python -m venv env
    source env/bin/activate # on Windows use `env\Scripts\activate`
    pip install Flask psycopg2-binary python-docx docxtpl pypdf reportlab
    ```

2.  **Database Setup:**
    *   The application connects to a PostgreSQL database named `esus` on `localhost:5433`.
    *   The database credentials are in the `app.py` file.
    *   The SQL scripts to set up the database schema and initial data are in the `bd_sistema_aps/` directory.

3.  **Run the Application:**
    ```bash
    flask run
    ```
    The application will be available at `http://127.0.0.1:5000`.

**Frontend (JavaScript):**

*   The frontend is composed of static JavaScript files in the `static/` directory. There are no explicit build steps mentioned in the `package.json` file. The `eslint` dependency suggests that there is a linting process in place.
*   **TODO:** Document the frontend build process if there is one (e.g., for TailwindCSS).

## Development Conventions

*   **Backend:**
    *   The main application logic is in `app.py`.
    *   The database connection details are hardcoded in `app.py`. For a production environment, these should be moved to environment variables.
    *   The SQL queries are embedded within the Python code.
*   **Frontend:**
    *   JavaScript files are located in the `static/` directory.
    *   The project uses `eslint` for code linting. Run `npx eslint .` to check for issues.
*   **Database:**
    *   Database scripts are located in the `bd_sistema_aps/` directory.
    *   The database schema is documented in `docs/database-schema.md`.
*   **Documentation:**
    *   The project documentation is in the `docs/` directory.
    *   The main documentation file is `docs/README.md`.
