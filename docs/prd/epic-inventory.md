# Pharmacy System – Inventory & Stock Management PRD

This shard covers the MVP epics and user stories for **inventory, expiry, stock operations, reordering, visibility, and reporting**.

---

## Epic 1 – Product & Multi‑Unit Model (Box → Pad → Piece)

**Goal:** Represent medicines with clear unit conversions so all stock changes stay consistent.

### Story 1.1 – Define product with multi‑unit structure
**As a** pharmacist  
**I want** to define products with Box/Pad/Piece and conversion factors  
**So that** stock is tracked correctly across units.

**Acceptance criteria:**
- I can create/edit a product with:
  - Name, code, main unit.
  - Units: Box, Pad, Piece with configurable counts (e.g. 1 box = N pads, 1 pad = M pieces).
- System stores and uses conversion factors consistently.
- Validation prevents zero/negative or clearly invalid conversions.

### Story 1.2 – View normalized quantities
**As a** pharmacist  
**I want** to see stock in both main unit and pieces  
**So that** I quickly understand true availability.

**Acceptance criteria:**
- Product list shows:
  - Quantity in main unit (e.g. box or pad).
  - Equivalent pieces.
- All calculations use the same conversion rules as defined in Story 1.1.

---

## Epic 2 – Batch & Expiry Management

**Goal:** Track batch numbers and expiry dates to reduce losses from expired stock.

### Story 2.1 – Record batches on stock receipt
**As a** pharmacist  
**I want** to record batch number, expiry date, and quantity when receiving stock  
**So that** I can later see what will expire and when.

**Acceptance criteria:**
- On "Stock In", I must enter:
  - Product, quantity (in unit), batch number, expiry date.
- System creates a batch record linked to the product.
- Validation:
  - Expiry date must be in the future (or show a clear warning if very near/just past).
  - Batch number is required.

### Story 2.2 – View batches per product
**As a** pharmacist  
**I want** to see all active batches for a product with expiries  
**So that** I can make dispensing and return decisions.

**Acceptance criteria:**
- Product detail view shows for each batch:
  - Batch number, quantity, expiry date, status (active / expired).
- Batches sorted by earliest expiry first.
- Expired batches visually distinct from active ones.

### Story 2.3 – Near‑expiry warning list
**As a** pharmacist  
**I want** a list of batches close to expiry  
**So that** I can act before medicines expire.

**Acceptance criteria:**
- Configurable or default window (e.g. next 3 months).
- List shows product, batch, expiry date, quantity.
- Expired vs near‑expiry clearly differentiated (e.g. colour or label).

---

## Epic 3 – Stock Operations (In/Out/Adjust)

**Goal:** Ensure every change in physical stock is reflected in the system.

### Story 3.1 – Receive stock
**As a** pharmacist  
**I want** to record stock received from suppliers  
**So that** inventory increases correctly with proper batch/expiry data.

**Acceptance criteria:**
- "Stock In" form includes:
  - Product, quantity + unit, batch number, expiry date, optional supplier reference.
- On save:
  - Product total increases according to conversion rules.
  - Batch is created or updated (per Epic 2).
- Action is logged with user and timestamp.

### Story 3.2 – Issue/dispense stock (simple)
**As a** pharmacist  
**I want** to record stock going out  
**So that** available inventory stays accurate, even without full POS.

**Acceptance criteria:**
- "Stock Out" form includes:
  - Product, quantity + unit, reason (e.g. sold, sample, adjustment).
- System selects batch(es) using a simple rule (e.g. FEFO – earliest expiry first) or allows manual batch selection in MVP.
- Product total decreases, batch quantities updated accordingly.
- Action logged with user and timestamp.

### Story 3.3 – Manual adjustments
**As a** pharmacist  
**I want** to adjust stock when I find discrepancies  
**So that** the system is corrected to match reality.

**Acceptance criteria:**
- "Adjust stock" form includes:
  - Product, delta quantity (+ or −), unit, reason.
- Adjustment clearly labelled as an adjustment in movement history.
- Requires a confirmation step before applying.

---

## Epic 4 – Reordering & Thresholds

**Goal:** Support guided reordering to reduce stockouts and over‑stocking.

### Story 4.1 – Configure minimum and reorder levels
**As a** pharmacist  
**I want** to set min and target levels per product  
**So that** the system can tell me when I’m low.

**Acceptance criteria:**
- On product settings, I can define:
  - Minimum stock level.
  - Target (reorder) level.
- Levels are stored consistently in a chosen base unit, with clear display in the UI.

### Story 4.2 – Low‑stock list with suggestions
**As a** pharmacist  
**I want** a view of products below minimum with suggested order quantities  
**So that** I can prepare supplier orders quickly.

**Acceptance criteria:**
- "Reorder" view lists products where current stock < minimum.
- For each product, shows:
  - Min level, current level, target level.
  - Suggested order quantity (e.g. target − current).
- Export or basic copy out of the list is possible (CSV or similar acceptable for MVP).

---

## Epic 5 – Inventory Visibility & Search

**Goal:** Give fast, reliable visibility into what’s in stock.

### Story 5.1 – Inventory overview page
**As a** pharmacist  
**I want** a main inventory page  
**So that** I can quickly see current stock and statuses.

**Acceptance criteria:**
- Paginated, searchable table including:
  - Product name/code.
  - Total quantity (main unit + equivalent pieces).
  - Indicator if near‑expiry stock exists.
  - Indicator if below minimum.
- Supports sorting by name, quantity, and urgency (e.g. low stock / near expiry).

### Story 5.2 – Fast product search
**As a** pharmacist  
**I want** to search by name or code  
**So that** I can answer “Do we have this?” in under ~10 seconds.

**Acceptance criteria:**
- Search box filters the inventory list as I type.
- Supports search by partial name and by code.
- Results load quickly for typical data volumes (thousands of SKUs).

---

## Epic 6 – Reporting

**Goal:** Reduce manual work on key inventory reports.

### Story 6.1 – Near‑expiry report
**As a** pharmacist  
**I want** a downloadable near‑expiry report  
**So that** I can plan actions or share with the owner.

**Acceptance criteria:**
- Filter by date range and product (and category, if available).
- Shows product, batch, expiry date, quantity, days to expiry.
- Exportable as CSV.

### Story 6.2 – Stock movement history
**As a** pharmacist  
**I want** to see movement history per product  
**So that** I understand how stock changed over time.

**Acceptance criteria:**
- Product detail page shows chronological list of movements:
  - Date/time, user, type (in/out/adjust), quantity, reason, batch where applicable.
- Can filter by date range.
- Data consistent with all operations in Epics 3 & 4.
