# StudyFlow setup guide

StudyFlow is a student task dashboard built with Next.js, TypeScript, React, Supabase, and Lucide.

## 1) Install Node.js
Install the current Node.js LTS from https://nodejs.org/. Restart VS Code after installation and check in its terminal:

```powershell
node -v
npm -v
```

## 2) Install dependencies and run locally
Open this folder in VS Code. In the terminal:

```powershell
npm install
npm run dev
```
Then open http://localhost:3000.

## 3) Create your Supabase project
1. Create a project at https://supabase.com/ and open its SQL Editor.
2. Copy/paste all of `supabase/schema.sql` and run it.
3. Open Project Settings > API (or Connect/API keys, depending on the dashboard version).
4. Copy your Project URL and the publishable/anon key. **Never use a service-role/secret key in this frontend.**

## 4) Add environment variables
Create a file named `.env.local` in the project root (same folder as package.json). Copy the two lines from `.env.example` and replace them with your own values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY
```
Stop and restart the dev server after changing this file (Ctrl+C, then `npm run dev`).

## 5) Test authentication and task flow
- Create an account in the StudyFlow UI.
- Depending on your Supabase Auth email-confirmation setting, confirm the email before signing in.
- Try adding, editing, completing, searching, filtering, and deleting tasks.
- RLS policies ensure each signed-in user can access only their own task rows.

## 6) GitHub
Create an empty repository named `studyflow` (do not add README/license if uploading this existing project). From this folder:

```powershell
git init
git add .
git commit -m "Initial StudyFlow app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/studyflow.git
git push -u origin main
```
Do not commit `.env.local` (it is ignored by `.gitignore`).

## 7) Vercel deployment
1. Go to https://vercel.com/ and import your GitHub `studyflow` repository.
2. Keep the detected Next.js framework settings.
3. Add the same two environment variables from `.env.local` in Vercel Project Settings > Environment Variables.
4. Deploy. Future pushes to `main` automatically trigger redeployments.
5. In Supabase Auth > URL Configuration, set Site URL to the Vercel domain and add the deployed domain under Redirect URLs if you enable email confirmation or OAuth.

## Troubleshooting
- If `npm`/`npx` is not recognized, install Node.js LTS, then close and reopen VS Code.
- If environment values are changed, restart `npm run dev`.
- If Supabase says relation `tasks` not found, rerun `supabase/schema.sql` in the SQL Editor.
- If authentication errors appear, verify the project URL and publishable/anon key are copied correctly, and check Supabase Auth settings.
