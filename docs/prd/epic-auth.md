# Pharmacy System – Authentication & Audit PRD

This shard covers the MVP epics and user stories for **authentication and basic auditability**.

---

## Epic 7 – Authentication & Basic Access Control

**Goal:** Ensure only authorized staff can access and modify inventory, and that key actions are traceable.

### Story 7.1 – User login with Appwrite
**As a** pharmacist/owner  
**I want** pharmacy staff to log in with their own accounts  
**So that** only authorized users can access the system and actions can be traced.

**Acceptance criteria:**
- The app uses **Appwrite Authentication** for login.
- A user must be authenticated to access any inventory pages or perform stock operations.
- On successful login, the user is taken to the main inventory view (or appropriate landing page).
- On failed login, the user sees a clear error message without exposing technical details.
- Logout is available and returns the user to a public/landing or login page.

### Story 7.2 – Basic roles: pharmacist and assistant
**As a** pharmacist/owner  
**I want** at least two basic roles (pharmacist and assistant)  
**So that** I can control who can perform certain actions.

**Acceptance criteria:**
- There is a way to distinguish at least these roles in Appwrite (e.g. teams, permissions, or role field):
  - **Pharmacist** – full inventory access.
  - **Assistant** – can perform day‑to‑day inventory operations; restrictions, if any, are clearly defined.
- The frontend respects role information when deciding which actions are enabled/visible.
- Unauthorized actions are blocked server‑side via Appwrite permissions or functions.

### Story 7.3 – Protect write operations with auth
**As a** pharmacist/owner  
**I want** all write operations (stock in, stock out, adjustments, settings) to require authentication  
**So that** anonymous users cannot modify inventory.

**Acceptance criteria:**
- "Stock In", "Stock Out", "Adjust Stock", and product/threshold edits all require an authenticated user.
- If a user is not logged in or loses their session, write attempts are rejected and the user is prompted to log in again.
- Appwrite collection and function permissions are configured to **deny writes** from unauthenticated contexts.

### Story 7.4 – Tag movements with user identity
**As a** pharmacist/owner  
**I want** each stock movement to record who performed it  
**So that** I can trace and review changes later.

**Acceptance criteria:**
- Every stock movement record (in/out/adjust) includes:
  - `userId` (from Appwrite auth).
  - Timestamp.
- Where practical, the UI shows a human‑readable user name next to movement entries.
- If a user account is later disabled, historical movement records still retain the original user reference.

### Story 7.5 – Basic audit views
**As a** pharmacist/owner  
**I want** to view a history of inventory changes  
**So that** I can investigate discrepancies or misuse.

**Acceptance criteria:**
- Product detail page includes a **movement history** section (see Reporting stories) where:
  - Each entry shows date/time, user, type (in/out/adjust), quantity, reason, and batch if relevant.
- Optional high‑level audit view (later) can filter by user or date range, but MVP may limit this to per‑product history.
- Data shown is read‑only and derived directly from the movement records tagged with user and timestamp.
