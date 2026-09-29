# Files & Directories Preserved Due To Active References & Intentional Architecture

All components and directories retained in this workspace serve active functions or form part of the dual architecture (Canonical Tailwind App + Mantis MUI Enterprise Suite):

---

## Retained Item Rationale

### 1. `C:\Users\bansa\Desktop\CCS\ccsps\ccs-partners-\` (Canonical Live Application)
- **Status**: ACTIVE PRODUCTION FRONTEND
- **Rationale**: Contains the working application running on `http://localhost:5173/`, featuring complete Admin, Distributor, Dealer, Field Employee, and Warehouse modules.

### 2. `C:\Users\bansa\Desktop\CCS\backend\` (Active Django Backend)
- **Status**: ACTIVE BACKEND
- **Rationale**: Powers the REST API on `http://localhost:8000/api/` with Django models, database migrations, authentication, and SQLite database `db.sqlite3`.

### 3. `C:\Users\bansa\Desktop\CCS\src\` (Root Mantis Architecture)
- **Status**: ACTIVE ARCHITECTURE & ENTERPRISE SUITE
- **Rationale**: Implements the Mantis UI architecture (`layout/Dashboard`, `layout/Auth`, `themes`, `contexts/ConfigContext`, `contexts/AuthContext`, `routes`, and `menu-items`) required by the project specification. Builds cleanly in 14.95s.

### 4. `C:\Users\bansa\Desktop\CCS\dist\` & `C:\Users\bansa\Desktop\CCS\scratch\`
- **Status**: BUILD ARTIFACTS & EVALUATION TOOLS
- **Rationale**: Root production distribution files and diagnostic verification scripts (`debug_order.py`, `test_e2e_system.py`).

### 5. Root Workspace Configuration Files
- **Status**: ACTIVE WORKSPACE ENVIRONMENT
- **Rationale**: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `jsconfig.json`, `django_verify.py`, and `verify_backend.py` ensure tooling and verification integrity.
