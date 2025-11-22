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