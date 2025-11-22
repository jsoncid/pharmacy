---
trigger: always_on
---

Frontend Framework: React ^19.0.0
Build Tool: Vite ^6.1.0
Language: TypeScript ~5.7.2
Styling: Tailwind CSS ^4.0.8
Routing: React Router ^7.1.5
Linting: ESLint ^9.19.0
Charts: ApexCharts ^4.1.0, React ApexCharts ^1.7.0
Calendar: FullCalendar (various packages, ^6.1.15)
Maps: React JVectorMap (^1.0.4 for core, ^1.1.2 for world)
UI Libraries: Swiper ^11.2.3, Flatpickr ^4.6.13
Utilities: Clsx ^2.1.1, Tailwind Merge ^3.0.1, React DnD (^16.0.1), React Dropzone ^14.3.5, React Helmet Async ^2.0.5
Backend-as-a-Service: Appwrite ^21.4.0
Additional development dependencies include PostCSS for CSS processing and SVG import support via Vite plugin. The app is configured as a module-based ES modules project.





Based on the Appwrite documentation for developing functions locally, here's what I learned:

Key Points for Local Function Development:
Dynamic API Keys: When running functions locally with appwrite run functions, the function automatically receives special headers that provide access to project services without requiring sessions or API keys.
Local Execution: Use appwrite run functions --function-id "<FUNCTION_ID>" to run your function locally on a port (default 3000).
Headers Available: The function receives headers that allow it to access Appwrite services. The documentation mentions x-appwrite-user-id and x-appwrite-user-jwt when using --user-id, but for dynamic API keys, there are additional headers available.
No API Key Needed: For local development, you don't need to set setKey() - the dynamic headers provide the necessary permissions.
For Your Function:
Your current approach of using req.headers['x-appwrite-key'] might work, but the documentation suggests the headers are automatically provided. Try running your function locally:







# UI Component Usage Rule

When generating frontend code (React, Next.js, or any JSX/TSX):

1. Always use the predefined UI components from my component library when creating:
   - Textboxes / Input fields
   - Textareas
   - Buttons
   - Tables
   - Select dropdowns
   - Modals
   - Forms
   - Cards
   - Alerts / Toasts
   - Other common UI elements

2. Never use raw HTML elements like:
   <input>, <button>, <table>, <select>, <form>, <textarea>

3. The default components to use:
   see C:\Users\USER\Documents\pharmacy\src\components

4. Ensure all components follow my UI library style conventions:
Language: TypeScript ~5.7.2
Styling: Tailwind CSS ^4.0.8
Routing: React Router ^7.1.5
Linting: ESLint ^9.19.0
Charts: ApexCharts ^4.1.0, React ApexCharts ^1.7.0
Calendar: FullCalendar (various packages, ^6.1.15)
Maps: React JVectorMap (^1.0.4 for core, ^1.1.2 for world)
UI Libraries: Swiper ^11.2.3, Flatpickr ^4.6.13
Utilities: Clsx ^2.1.1, Tailwind Merge ^3.0.1, React DnD (^16.0.1), React Dropzone ^14.3.5, React Helmet Async ^2.0.5
Backend-as-a-Service: Appwrite ^21.4.0
Additional development dependencies include PostCSS for CSS processing and SVG import support via Vite plugin. The app is configured as a module-based ES modules project.


5. When creating a form:
   - Always wrap fields with `<FormField />`
   - Always include validation and error messages
   - Always follow consistent spacing + layout

6. When generating tables:
   - Use reusable table components
   - Never manually write raw `<table>` structure
   - Follow my pagination limit to 10 and sorting patterns

7. When unsure which component to use:
   - Use the closest matching component from my existing UI folder
   - Or ask me what component should be used

8.Button uniformity  follow a consistent pattern:

Button size: Small
Primary actions (Create, Update, Save): Green background with larger padding
Edit buttons: Blue background
Cancel buttons: Gray background
Delete buttons: Red background
Each button type maintains consistent sizing, colors, and hover states for a cohesive user interface.

Input text sizes standardized to text-sm across all pages. All input fields, select elements, and search inputs now use consistent text sizing for a uniform user interface. This includes form inputs, search fields, and edit form inputs

This rule applies to **all frontend file generations** in this project.




Cursor Rules for CRUD: Always Modal
1. General Principle

All CRUD actions must open in a modal.

Avoid inline editing or page redirection unless explicitly approved.

2. Cursor Behavior Rules
Cursor Action	Behavior	Modal Requirement
Hover over CRUD buttons	Show pointer cursor	Yes
Click on "Create" button	Opens modal form for creation	Mandatory
Click on "Read"/"View" button	Opens modal displaying details	Mandatory
Click on "Edit"/"Update" button	Opens modal pre-filled with record data	Mandatory
Click on "Delete" button	Opens confirmation modal	Mandatory
Click outside modal (backdrop)	Closes modal if allowed	Optional
Keyboard shortcuts	Ctrl + N / Ctrl + E opens modal	Recommended
3. Modal Design Rules

Consistent layout across all CRUD modals.

Header clearly indicates the action (Create, Edit, View, Delete).

Form validation occurs inside the modal.

Save/Submit buttons should close the modal on success.

Cancel/Close buttons revert without changes.

Modal size should be responsive:

Small forms → small modal

Large forms → medium/full modal

4. UX Enhancements

Always provide feedback messages inside the modal (success, error).

If the modal contains a table/list, consider inline refresh without closing modal (optional).

Ensure focus management: first input field active on open; focus returns to the CRUD button on close.








Rules for Using .env Variables in Appwrite CLI / MCP Access
1. General Principles

Never hardcode IDs, keys, or sensitive data. Always use .env variables.
.env variables should be clearly named, descriptive, and consistent.
Variables must match Appwrite resources (Collections, Attributes, Functions) exactly as used in CLI or MCP scripts.
Always validate .env variables before running CLI scripts or MCP automation.

2. Naming Conventions
Resource Type	Example .env Variable	Notes
Project ID	APPWRITE_PROJECT_ID	Required for CLI initialization
API Key / Secret	APPWRITE_API_KEY	Server-side only; never in public frontend
Collection ID	APPWRITE_COLLECTION_USERS	Reference collection via variable
Attribute / Field	APPWRITE_ATTRIBUTE_EMAIL	Reference attributes for queries or updates
Function ID	APPWRITE_FUNCTION_CREATE_USER	For function execution in CLI/MCP

Rule: Uppercase, underscores, no spaces. Keep consistent across projects.

3. CLI Rules
Always reference .env variables for Appwrite CLI commands:


4. MCP / Automation Rules

When writing scripts to automate MCP tasks (like seeding data, managing collections, or triggering functions):

Use .env variables everywhere for IDs or attribute names.

Do not expose API keys in scripts shared publicly.

Validate variables before execution:

for var in APPWRITE_PROJECT_ID APPWRITE_API_KEY APPWRITE_COLLECTION_USERS APPWRITE_FUNCTION_CREATE_USER; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done


Use variables consistently in JSON payloads, filters, and CLI commands.

5. Security Rules

.env files must never be committed to git.

Use separate .env files for local, staging, and production.

Rotate API keys regularly and update .env accordingly.