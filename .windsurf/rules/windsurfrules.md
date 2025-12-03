---
trigger: always_on
---

## SearchableSelectWithAdd Rules

1. **When to use**
   - Use [SearchableSelectWithAdd](cci:1://file:///c:/Users/USER/Documents/pharmacy/src/components/form/SearchableSelectWithAdd.tsx:14:0-39:2) from  
     [src/components/form/SearchableSelectWithAdd.tsx](cci:7://file:///c:/Users/USER/Documents/pharmacy/src/components/form/SearchableSelectWithAdd.tsx:0:0-0:0) for any **searchable single-select dropdown that can also create new lookup values with a “+” button**.
   - Examples: Category, ATC Code, Anatomical, Pharmacological, Dosage Form, Container, Material, Size, Capacity & Volume, Sterility, Usability, Strap, Content.

2. **Component composition**
   - [SearchableSelectWithAdd](cci:1://file:///c:/Users/USER/Documents/pharmacy/src/components/form/SearchableSelectWithAdd.tsx:14:0-39:2) wraps:
     - [SearchableSelect](cci:1://file:///c:/Users/USER/Documents/pharmacy/src/components/form/SearchableSelect.tsx:21:0-208:2) for the searchable dropdown.
     - A small primary **“+” button** on the right.
   - Props:
     - Inherits all props from [SearchableSelect](cci:1://file:///c:/Users/USER/Documents/pharmacy/src/components/form/SearchableSelect.tsx:21:0-208:2) (`options`, `placeholder`, `defaultValue`, `value`, `onChange`, `onSearchChange`, etc.).
     - Extra props:
       - `onAdd: () => void` – **must open a modal** (no inline creation).
       - `addButtonLabel?: string` – default `"+"`.
       - `addButtonDisabled?: boolean`.
       - `addButtonClassName?: string` – default green primary button styling.

3. **Create-on-the-fly pattern (CRUD in modal)**
   - `onAdd` must **always** open a modal that follows:
     - Uses [Modal](cci:1://file:///c:/Users/USER/Documents/pharmacy/src/components/ui/modal/index.tsx:11:0-93:2), `Form`, `Label`, `InputField`, `Button`.
     - One text field: `description`.
     - Backend create via Appwrite:
       - `databases.createDocument(DATABASE_ID, <LOOKUP_COLLECTION_ID>, ID.unique(), { description, status: true })`.
     - On success:
       - Prepend new document into the corresponding lookup state list (e.g. `setAtcCodes`, `setMaterialsData`).
       - Optionally set the selected ID in the parent form (e.g. `setAtcCodeId`, `setMaterials`).
       - Close the modal.
     - On validation or error:
       - Show error text inside the modal (e.g. `Description is required.`, or Appwrite error).

4. **Server-side search pattern**
   - For collections that need backend search, `onSearchChange` must:
     - Use a shared handler like [createLookupSearchHandler(collectionId, setList)](cci:1://file:///c:/Users/USER/Documents/pharmacy/src/pages/Products/Products.tsx:302:2-334:4):
       - Build query array:
         - `Query.orderDesc("$createdAt")`
         - `Query.equal("status", true)`
         - If search term is non-empty:
           - `Query.contains("description", [searchTerm])`
         - `Query.limit(20)`
       - Call `databases.listDocuments(DATABASE_ID, collectionId, queries)`.
       - Replace the lookup list state with the result.
   - [SearchableSelect](cci:1://file:///c:/Users/USER/Documents/pharmacy/src/components/form/SearchableSelect.tsx:21:0-208:2) should still keep its local filtering behaviour; server-side search is an enhancement, not a replacement.

5. **Usage guidelines**
   - **Create modal**:
     - Small/medium modal size, consistent header text: `"Create <LookupName>"`.
     - Validate description before calling Appwrite.
     - Use existing button rules:
       - Primary create: small, green, consistent hover.
       - Cancel: small, gray/outline.
   - **Styling & text size**:
     - Maintain `text-sm` for inputs, search fields, and dropdown options.
     - Keep spacing/layout consistent with forms elsewhere in the app.
   - **Both Create and Edit flows**:
     - Use [SearchableSelectWithAdd](cci:1://file:///c:/Users/USER/Documents/pharmacy/src/components/form/SearchableSelectWithAdd.tsx:14:0-39:2) in **both** create and edit modals for the same lookup.
     - In edit modals, you may reuse the same `onAdd` (opens the same create modal) and `onSearchChange`.

6. **Collections mapping**
   - Each lookup must use its own collection ID and list state:
     - Category → `CATEGORY_COLLECTION_ID` → `setCategories` / `setCategory`.
     - ATC Code → `ATC_CODE_COLLECTION_ID` → `setAtcCodes` / `setAtcCodeId`.
     - Anatomical → `ANATOMICAL_COLLECTION_ID` → `setAnatomicals` / `setAnatomicalId`.
     - Pharmacological → `PHARMACOLOGICAL_COLLECTION_ID` → `setPharmacologicals` / `setPharmacologicalId`.
     - Dosage Form → `DOSAGE_FORM_COLLECTION_ID` → `setDosageForms` / `setDosageFormId`.
     - Container → `CONTAINER_COLLECTION_ID` → `setContainers` / `setContainerId`.
     - Material → `MATERIAL_COLLECTION_ID` → `setMaterialsData` / `setMaterials`.
     - Size → `SIZE_COLLECTION_ID` → `setSizesData` / `setSizes`.
     - Capacity & Volume → `CAPACITY_VOLUME_COLLECTION_ID` → `setCapacityVolumesData` / `setCapacityVolumes`.
     - Sterility → `STERILITY_COLLECTION_ID` → `setSterilitiesData` / `setSterilities`.
     - Usability → `USABILITY_COLLECTION_ID` → `setUsabilitiesData` / `setUsabilities`.
     - Strap → `STRAP_COLLECTION_ID` → `setStrapsData` / `setStraps`.
     - Content → `CONTENT_COLLECTION_ID` → `setContentsData` / `setContents`.


7. **Code Generation Comment Rules**

7.1. **When to add comments**
   - For any newly generated components, pages, hooks, or utilities, include short comments **when requested by the user** to explain:
     - The overall purpose of the file or component.
     - Non-obvious business rules or domain-specific logic.
     - Complex conditions, data transformations, or side effects.

7.2. **Comment style**
   - Keep comments **concise and high-signal**, avoiding restating obvious code.
   - Prefer comments **above** the relevant block (functions, handlers, effects) instead of inline at the end of lines.

7.3. **Framework-specific notes**
   - **React/TSX**:
     - Optionally add a brief file-level comment describing the component’s role in the UI or workflow.
     - Add short comments above key `useEffect` hooks, major event handlers, and complex JSX sections.

7.4. **Consistency**
   - Follow existing project terminology and patterns in comments.
   - Update or remove comments when code changes so they do not become misleading.


























