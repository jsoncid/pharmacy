# Project Brief: Pharmacy System

## Executive Summary

The **Pharmacy System** is a digital inventory and stock management solution designed for a **single-pharmacy setup**, focused on day‑to‑day use by the **pharmacist**. Its core goal is to bring accuracy and visibility to medicine stock across multiple units — from **Box → Pad → Piece** — while proactively managing **expiry dates** and **reordering**.

The system tackles the most common operational issues in a small pharmacy:
- Inaccurate stock counts caused by multi‑unit handling (boxes, pads, and individual pieces).
- Losses due to expired medicines, driven by weak expiry/batch tracking and lack of early warnings.
- Manual and late reordering, which leads to stockouts of important medicines.
- Poor real‑time visibility into what is actually available on shelves and in storage.
- Time‑consuming reporting (near‑expiring items, stock movement, basic usage patterns), often done manually or in spreadsheets.

By centralizing product, batch, and unit-level data, the Pharmacy System aims to give the pharmacist:
- A clear, real‑time inventory view across Box/Pad/Piece.
- Early alerts for near‑expiring items to reduce write‑offs.
- Guided reordering suggestions based on stock levels and minimum thresholds.
- Simpler, structured reports that support day‑to‑day decisions without complex tools.

---

## Problem Statement

In the current single‑pharmacy setup, the **pharmacist** manages medicines across multiple units (Box → Pad → Piece) using a mix of manual processes and basic tools. This leads to several recurring problems:

- Inaccurate stock counts across units: converting between boxes, pads, and pieces is error‑prone, so on‑hand quantities in records often don’t match what is physically on the shelves.
- Expiry tracking is weak: expiry dates and batches are not consistently monitored, so medicines are sometimes discovered only after they expire.
- Reordering is reactive and manual: orders are placed only when the pharmacist notices low stock, which can be late, causing stockouts of important medicines.
- Limited real‑time visibility: there is no single clear view of what is available right now, by product, batch, and location in the pharmacy.
- Reporting is time‑consuming: tasks like identifying near‑expiring items, reviewing stock movements, or preparing simple performance reports often require manual checking or spreadsheets.

These issues combine to create **financial loss** (expired or over‑stocked items), **operational stress** (fire‑fighting around stockouts and rush orders), and potential **risk to patient service** when needed medicines are unavailable. As prescription volumes and product variety grow, the current approach does not scale and becomes harder to control, making it increasingly urgent to introduce a more structured, system‑driven way of managing inventory and expiry.

---

## Proposed Solution

The **Pharmacy System** will be a focused inventory and stock‑control application built specifically for a **single pharmacy**, used primarily by the **pharmacist** and assistants during daily operations.

At its core, the system will:

- **Model medicines across multiple units**  
  Handle stock in **Box → Pad → Piece** with clear conversion factors (e.g. 1 box = N pads, 1 pad = M pieces), so all movements (receiving, dispensing, adjustments) keep quantities consistent.

- **Track batches and expiry dates**  
  Store **batch number**, **expiry date**, and **quantity per batch**, and maintain a real‑time view of:
  - Items close to expiry (e.g. next 3–6 months).
  - Items already expired and needing removal.

- **Support guided reordering**  
  Allow the pharmacist to set **minimum and reorder levels** per product. The system will show:
  - Which items are below threshold.
  - Suggested reorder quantities based on current stock and unit conversions.

- **Provide an at‑a‑glance inventory view**  
  Offer a simple, searchable view by product that shows:
  - Available quantity (by unit and equivalent pieces).
  - Active batches and expiries.
  - Basic location or grouping (e.g. shelf/storage).

- **Generate simple, useful reports**  
  Produce straightforward reports for:
  - Near‑expiring items.
  - Stock movement history (in/out/adjustments).
  - Basic usage/sales trends for key medicines.

The initial version will prioritize **accuracy, clarity, and ease of use** over advanced analytics, ensuring the pharmacist can quickly trust the numbers on screen and act on them without complex training.

---

## Target Users

### Primary User Segment: Pharmacist in a Single Pharmacy

The primary user of the Pharmacy System is the **pharmacist** working in a **single, independent pharmacy** (optionally supported by pharmacy assistants).

- Profile
  - Licensed pharmacist (and possibly 1–2 assistants).
  - Manages day‑to‑day dispensing, stock control, and ordering.
  - Often multitasking between serving patients, checking prescriptions, and handling inventory.

- Current Behaviors & Workflows
  - Tracks stock levels using a mix of memory, shelf checks, and simple tools (paper, spreadsheets, or basic software).
  - Converts between **Box → Pad → Piece** manually when receiving, counting, and dispensing.
  - Monitors expiry informally (visual checks, box markings) rather than through a structured system.
  - Places orders reactively when items “look low” or when staff notice frequent stockouts.

- Needs & Pain Points
  - A fast, simple way to know **exact stock** across units without doing manual conversions.
  - Clear visibility of **which batches are close to expiry** so they can be prioritized or returned early.
  - Guidance on **what to reorder and when**, instead of relying purely on memory or rough estimates.
  - Less time spent on **manual reporting** (near‑expiry lists, movement history) so they can focus on patients.

- Goals
  - Reduce **losses from expired or over‑stocked medicines**.
  - Avoid **stockouts** of critical drugs and improve service reliability to patients.
  - Gain confidence that the numbers on screen match what is actually on the shelf.
  - Keep the system simple enough to use daily without heavy training.

---

## Goals & Success Metrics

### Business Objectives

- Reduce expired stock losses by around 50% within 12 months, by proactively identifying and acting on near‑expiring items.
- Cut stockouts of key medicines (e.g. top 50–100 products) by around 70% within 6–12 months through better visibility and guided reordering.
- Reduce manual inventory/admin time (stock checks, expiry checks, reporting) by around 50%, freeing pharmacist time for patients.
- Improve cash flow by keeping stock closer to optimal levels (less over‑stocking of slow‑moving medicines, fewer emergency rush orders).

### User Success Metrics

- Time to answer "Do we have this medicine now?" reduced to **< 10 seconds** via search and clear stock display.
- Pharmacist’s subjective trust in system inventory rated **4/5 or higher** after the first 3 months.
- Manual full‑stock counts reduced to a small number per year (e.g. quarterly audits instead of frequent ad‑hoc recounts).
- Daily active use: the pharmacist (or assistant) uses the system for core stock movements on **most working days**.

### Key Performance Indicators (KPIs)

- **Expired stock value per month** – Track the value of medicines written off due to expiry; target a clear downward trend and a 50% reduction vs baseline.
- **Stockout incidents for priority medicines** – Count days when a priority item is out of stock; aim to cut these incidents by at least 70% for the defined priority list.
- **Near‑expiry items acted on** – Percentage of items that were flagged as near‑expiry and had a follow‑up action (used, discounted, returned) before expiry.
- **Time spent on monthly inventory/expiry reporting** – Average time to prepare essential reports; target at least 50% reduction compared to the current manual process.

---

## MVP Scope

### Core Features (Must Have)

- Multi‑unit product model (Box → Pad → Piece) with clear unit conversions.
- Batch and expiry tracking for each product and batch.
- Basic stock operations: receive stock, dispense/issue stock, manual adjustments with reasons.
- Guided reordering support using minimum stock and reorder levels per product.
- Inventory visibility with a searchable product list showing quantities and active batches.
- Essential reports: near‑expiry report, stock movement history, and simple inventory snapshot.
- Usability foundations: clean, simple UI and basic authentication for pharmacist and assistants.

### Out of Scope for MVP

- Full POS / billing / prescription management.
- Multi‑branch / chain management.
- Deep accounting/finance integrations.
- Complex supplier management or automatic electronic ordering.
- Advanced analytics and dashboards beyond basic reports.
- Mobile apps and offline‑first functionality.

### MVP Success Criteria

- The pharmacist can perform daily inventory operations (receive, issue, adjust, check stock, review near‑expiry) using only the system.
- The system is used on most working days over an initial pilot period (e.g. 4–8 weeks).
- After the pilot, the pharmacist reports higher confidence that on‑screen stock matches physical stock, and clear value from near‑expiry and reorder features.
- At least one cycle of reordering using the system’s suggestions has been completed successfully.

---

## Post‑MVP Vision

### Phase 2 Features

- Basic POS / dispensing integration so stock movements are driven by real transactions.
- Role‑based access and audit trail for key actions.
- Improved reporting and dashboards (e.g. top movers, slow movers, expiry risk).
- Supplier and purchase tracking for basic margin and cost insights.

### Long‑Term Vision (1–2 Years)

- Evolve from an inventory tool into a core operational system connecting inventory, dispensing, and basic billing for a single pharmacy.
- Provide smarter ordering recommendations using historical usage and seasonality.
- Support configurable workflows for different pharmacy practices without overcomplicating the base system.

### Expansion Opportunities

- Multi‑branch / chain support with centralized visibility.
- Integration with external systems (accounting tools, wholesaler platforms, drug databases where applicable).
- Mobile and low‑connectivity access for shelf checks and unstable internet environments.
- Advanced analytics and benchmarking against anonymized peers where appropriate.

---

## Technical Considerations

### Platform Requirements

- Target Platforms: web application for desktop/laptop; usable on modern tablets via browser.
- Browser/OS Support: modern Chrome, Edge, Firefox on recent Windows versions.
- Performance: initial load under ~3 seconds on typical pharmacy internet; common interactions under ~300–500 ms, supporting thousands of SKUs and tens of thousands of stock movements.

### Technology Preferences

- Frontend: React SPA with Vite, TypeScript, and Tailwind CSS; React Router for navigation.
- Backend/BaaS: Appwrite for auth, database, functions, and storage if needed.
- Database: Appwrite Databases/TablesDB for products, units, batches, movements, thresholds, users.
- Hosting/Infrastructure: static SPA hosting for frontend plus an Appwrite instance (cloud or self‑hosted), with CI/CD for builds and deployments.

### Architecture Considerations

- Repository Structure: single repo with frontend app and Appwrite functions under `functions/`, shared configuration via environment variables.
- Service Architecture: thin frontend using Appwrite as BaaS; business rules for stock adjustments and expiry processing can live in Appwrite functions.
- Integration Requirements (short term): frontend ↔ Appwrite only; (medium term) potential notification channels and CSV/Excel export.
- Security/Compliance: least‑privilege permissions in Appwrite, no secrets in public builds, basic auditability for key inventory actions, and alignment with local expectations for inventory data handling.

---

## Constraints & Assumptions

### Constraints

- Budget: keep recurring costs low, suitable for a single independent pharmacy; avoid heavy paid dependencies.
- Timeline: aim for a usable MVP in a few months, prioritizing core inventory + expiry + reordering.
- Resources: essentially a single main developer (you) plus this AI assistant; design for simplicity and maintainability.
- Technical: stay within React + Vite + TypeScript + Tailwind + Appwrite; avoid heavy custom backends beyond Appwrite unless clearly justified.

### Key Assumptions

- The pharmacy is single‑location for the foreseeable future; multi‑branch is a future concern.
- Pharmacist and assistants are willing to use the system daily once it is simple and stable.
- Existing tools (spreadsheets/manual methods) can be replaced or minimized for inventory and expiry once the system is in place.
- Internet and hardware are sufficient for a modern web app; no strict offline requirement for MVP.
- Regulatory requirements for MVP are primarily about inventory record‑keeping, not detailed patient medical records.

---

## Risks & Open Questions

### Key Risks

- Adoption risk if staff continue using old methods due to perceived complexity or slowness.
- Data accuracy risk from incomplete initial data entry or inconsistent recording of stock movements.
- Expiry tracking risk if batch and expiry details are not captured consistently at receiving time.
- Single‑developer/capacity risk leading to slower progress or delayed bug fixes.
- Technical platform risk from dependency on Appwrite and chosen hosting.
- Security and access risk from weak local PC practices or shared logins.

### Open Questions

- Region & regulations: which country/region and what regulations might affect record‑keeping?
- Data migration: what existing data formats are in use today and how much history must be imported?
- Prescription/POS linkage: is there an existing system, and should we integrate with or replace parts of it later?
- Hardware & connectivity: what the actual environment looks like (PCs, terminals, internet reliability)?
- Alert & notification preferences: how near‑expiry and low‑stock alerts should be surfaced now and later.

### Areas Needing Further Research

- Local pharmacy practices for expiry and stock control.
- Observation of current workflows to tune UI and processes.
- Review of comparable small‑pharmacy systems in the region.
- Data migration strategy from current methods into the new system.

---

## Appendices

### A. Research Summary

- Formal market/competitive research: not yet conducted.
- Current understanding: small single‑pharmacy context, pharmacist as primary user, core pains around multi‑unit stock handling, expiry, reordering, and reporting.
- Planned research: observe workflows, review existing systems, and validate local expectations for expiry and inventory.

### B. Stakeholder Input

- Primary stakeholder: pharmacist/pharmacy operator (you).
- Key inputs: need for Box → Pad → Piece handling, priority on expiry tracking and reordering over full POS in MVP, and a tool simple enough for daily use.

### C. References

- Internal notes and examples from current manual processes.
- Technical stack references (React, Vite, TypeScript, Tailwind CSS, Appwrite docs).
- Future market/competitor/regulatory documents as they are gathered.

---

## Next Steps

### Immediate Actions

1. Confirm remaining context details (country/region, existing POS or systems).
2. Define initial data model in Appwrite for products, units, batches, movements, thresholds, users.
3. Design core UI flows (inventory overview, stock in/out/adjust, near‑expiry and low‑stock views, basic reports).
4. Set up or verify Appwrite project configuration and environment variables, including database and function IDs.
5. Implement an MVP slice end‑to‑end for a small subset of medicines and run through the full flow.
6. Plan an initial pilot in the real pharmacy over 4–8 weeks.
7. Treat this brief as a living document and update it as you learn from pilot use and research.

### PM Handoff

This Project Brief provides the context for **Pharmacy System**.

A Product Manager (or you in that role) should now:
- Use this brief as the source of truth for scope and priorities.
- Move into PRD generation mode, turning this into detailed user stories, acceptance criteria, and release planning.
- Collaborate with development (and this assistant) to refine details section by section, keeping the brief aligned with actual decisions.
