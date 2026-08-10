## Development Commands
* Start Dev Server: `npm run dev`
* Run Astro CLI: `npm run astro`
* Production Build: `npm run build`
* Preview Build: `npm run preview`

## Project Architecture & Layout
* **Global Layout**: `src/layouts/MainLayout.astro` (Always wrap pages in this layout).
* **Styling Framework**: **Bootstrap**. (Strictly use Bootstrap classes. Never use Tailwind CSS).
* **Components**: Keep reusable UI elements inside `src/components/` using PascalCase names.

## Code Conventions
* **Language**: **Pure JavaScript**. (Do not write TypeScript types or syntax in frontmatter).
* **CSS Location**: **No inline CSS**. (Never write `<style>` tags inside components or inline `style=""` attributes. All custom CSS must go into an external `.css` file).
* **Slashes**: Always use POSIX forward slashes (`/`) for file paths in prompts and code.
* **State Management**: No external libraries. Rely strictly on standard Astro component props and native web APIs.

## Token-Saving Workflow Rules
1. **Targeted Reading**: Never use broad file searches. Ask the user for specific relative file paths.
2. **No Browser Automation**: Do not attempt to spin up or render pages in an internal browser. Rely entirely on the user's explicit instructions and text logs.
3. **Incremental Changes**: Provide targeted code diffs or specific component updates rather than rewriting entire files.
