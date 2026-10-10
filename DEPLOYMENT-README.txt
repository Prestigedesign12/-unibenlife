UNIBEN LIFE — deployment folder layout

IMPORTANT: These files must sit together at the ROOT of the GitHub repository.
The repository root should show:
  index.html
  package.json
  src/ (containing main.jsx and styles.css)
  vercel.json

Do not upload the outer project folder as a nested folder. Do not upload only the ZIP file.

To fix the Vercel error:
1. Download and extract this ZIP on your computer.
2. Open the extracted folder. You should immediately see index.html, package.json, and src.
3. In your GitHub repository, upload the CONTENTS of this extracted folder (not the containing folder and not only the ZIP). If prompted, replace existing files.
4. Confirm GitHub shows src/main.jsx at the repository root path: src/main.jsx.
5. Return to Vercel and redeploy the latest commit.

Build settings:
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install

Cloud login/database integration is optional and is not configured by this project unless you provide Supabase project credentials. The app can still be deployed as a prototype.
