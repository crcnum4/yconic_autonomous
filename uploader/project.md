yconic-autonomous (Next.js + NextAuth + MongoDB + S3)

Role: You are a senior full-stack engineer generating production-ready code for a Next.js (App Router) application called yconic-autonomous. Build only the features listed below. Prioritize correctness, security, and clean abstractions.

Project Brief

Build the initial UI and backend for:
	1.	a simple landing/home page,
	2.	authentication (sign up/in/out),
	3.	a document uploader that stores files in Amazon S3 and metadata in MongoDB.

We are ingesting user-uploaded files for now (no direct API integrations yet). Supported categories:
	•	Zoom notes (txt, md, pdf, docx)
	•	Calendar data (ics, csv)
	•	Emails (eml, mbox, txt)

Do not implement AI analysis yet—just leave clear TODO hooks for later processing.

Tech & Constraints
	•	Framework: Next.js 14+ (App Router, TypeScript, Server Actions allowed).
	•	UI: Tailwind CSS + accessible components. Keep styling minimal and clean.
	•	Auth: NextAuth.js with Credentials (email + magic link) or EmailProvider; include Google as optional OAuth provider behind env flags.
	•	DB: MongoDB via Mongoose.
	•	Storage: Amazon S3 using server-generated presigned POST (preferred) or presigned PUT. Upload must bypass server for large files.
	•	Security: Strict MIME/type & extension whitelist, size limit (default 25MB/file, configurable), auth checks, server-side validation, basic rate limiting for upload init.
	•	Runtime: Node (not edge) for S3 signing.

Deliverables
	•	Working Next.js app with:
	•	/ (Home): simple marketing copy + “Get Started” CTA to sign in.
	•	Auth flow: sign-in, sign-out, protected area.
	•	/dashboard: shows uploader & user’s uploaded documents list (paginated).
	•	Uploader UI: drag-and-drop + file picker, progress display, cancel, retry.
	•	Backend APIs:
	•	Create S3 presigned upload,
	•	Record upload completion,
	•	List user files,
	•	Soft-delete a file.
	•	Mongo Models: User, Document (see schema below).
	•	Env & config scaffolding with example .env.example.
	•	Basic tests for API routes and model validation (vitest or jest).
	•	README.md with setup steps and dev scripts.

Environment Variables (create .env.example)

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme

# Auth providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_USE_GOOGLE=false

# Mongo
MONGODB_URI=mongodb://localhost:27017/
MONGODB_TABLE=yconic_autonomous

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=yconic-autonomous-dev
S3_PUBLIC_BASE_URL=https://yconic-autonomous-dev.s3.amazonaws.com

# Upload constraints
MAX_UPLOAD_MB=25
ALLOWED_MIME_LIST=application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/calendar,text/csv,message/rfc822,application/mbox

# Misc
NODE_ENV=development

Data Models (Mongoose, TypeScript)

// src/lib/db/models/User.ts
import { Schema, model, models, Types } from "mongoose";
const UserSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true, index: true },
  image: String,
  emailVerified: Date
}, { timestamps: true });
export default models.User || model("User", UserSchema);

// src/lib/db/models/Document.ts
import { Schema, model, models, Types } from "mongoose";

export type DocCategory = "zoom_notes" | "calendar" | "email";

const DocumentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
  originalName: { type: String, required: true },
  s3Key: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  byteSize: { type: Number, required: true, min: 1 },
  category: { type: String, enum: ["zoom_notes", "calendar", "email"], required: true },
  status: { type: String, enum: ["uploaded", "processing", "ready", "failed"], default: "uploaded", index: true },
  deletedAt: { type: Date, default: null },
  sha256: { type: String, default: null }, // optional dedupe later
  meta: { type: Schema.Types.Mixed } // extensible (e.g., parsed headers)
}, { timestamps: true });

export default models.Document || model("Document", DocumentSchema);

Category → File Types (server-side enforced)
	•	zoom_notes: .txt, .md, .pdf, .docx
	•	calendar: .ics, .csv
	•	email: .eml, .mbox, .txt

Add a utility that maps file extension → category and MIME, and rejects unsupported combos.

Auth
	•	Configure NextAuth with Email (magic link) as default. Provide optional Google if AUTH_USE_GOOGLE=true.
	•	Protect /dashboard and all API routes below app/api/* (auth-required) except NextAuth internals.
	•	Use the NextAuth session to scope queries by user.

Folder/Layout Plan

src/
  app/
    layout.tsx
    globals.css
    page.tsx                  # Home
    dashboard/
      page.tsx                # Protected
    api/
      auth/[...nextauth]/route.ts
      upload/create-presigned/route.ts
      upload/complete/route.ts
      documents/list/route.ts
      documents/delete/route.ts
  components/
    AuthGuard.tsx
    Uploader.tsx              # drag & drop, progress, accepts multiple files
    DocumentsTable.tsx
    NavBar.tsx
  lib/
    auth/options.ts
    db/connect.ts
    db/models/User.ts
    db/models/Document.ts
    s3/presign.ts
    uploads/validation.ts     # size/mime/category checks
    utils/rateLimit.ts        # simple in-memory or Upstash placeholder
  styles/
    ...

API Contracts

POST /api/upload/create-presigned
	•	Auth: required
	•	Body:

{
  "files": [
    { "originalName": "meeting-notes.txt", "mimeType": "text/plain", "byteSize": 12345 }
  ]
}


	•	Behavior:
	•	Validate byteSize <= MAX_UPLOAD_MB.
	•	Validate mimeType in ALLOWED_MIME_LIST.
	•	Infer category from extension; reject if unknown.
	•	For each file, create an S3 key: user/{userId}/{timestamp}-{rand}-{slug(originalName)}
	•	Generate presigned POST (or PUT if easier) with content-type & size conditions.
	•	Return array of { s3Key, presigned, category }.
	•	Response:

{ "ok": true, "results": [ { "s3Key": "user/...", "category": "zoom_notes", "presigned": { /* fields & url */ } } ] }



POST /api/upload/complete
	•	Auth: required
	•	Body:

{
  "files": [
    { "s3Key": "user/...", "originalName": "meeting-notes.txt", "mimeType": "text/plain", "byteSize": 12345 }
  ]
}


	•	Behavior:
	•	For each file, store a Document with status="uploaded".
	•	(Future) enqueue parse/analysis job — leave a TODO.
	•	Response: { "ok": true }

GET /api/documents/list?cursor=<iso>&limit=20
	•	Auth: required
	•	Returns user’s non-deleted Document rows (newest first) with cursor pagination.

POST /api/documents/delete
	•	Auth: required
	•	Body: { "id": "<documentId>" }
	•	Soft-delete (set deletedAt) and optionally S3 delete (behind env flag).

Uploader UX (Requirements)
	•	Drag-and-drop + click to select.
	•	Per-file progress; disable “Complete” until all successful.
	•	Enforce max file size and type client-side and server-side.
	•	After upload success (to S3), call /api/upload/complete.
	•	On dashboard, show a table: filename, category, size (human), status, uploaded date, actions (delete).
	•	Helpful empty states and error messages.

Security & Hardening
	•	Validate all inputs (zod or server checks).
	•	Rate-limit /api/upload/create-presigned (simple in-memory token bucket; wrap for Upstash later).
	•	Ensure S3 object ACL is private; no public write. Access via presigned URL only (we don’t need read right now).
	•	Sanitize filenames (slugify), never trust client MIME alone—allowlist by extension and MIME.
	•	Don’t store secrets client-side. Don’t log secrets.

Implementation Notes
	•	Provide a small useUploader hook to coordinate: select → presign → direct upload → complete.
	•	Use fetch for presign & complete calls; use XMLHttpRequest or fetch with onUploadProgress polyfill (acceptable to implement with axios if you prefer).
	•	For S3 presigned POST, include size and content-type conditions; if using PUT, set Content-Type on request and ensure key is fixed.
	•	Create a small bytes.ts util for human-readable sizes.
	•	Create a categoryFromFilename.ts util mapping extensions → categories.

Tests (minimal)
	•	API unit tests for create-presigned and complete (happy path + invalid mime/oversize).
	•	Model validation tests for Document.
	•	Utility tests for category detection and byte formatting.

README (generate)

Include:
	•	Setup (env, npm i, dev scripts).
	•	How to run Mongo locally (docker one-liner) and connect.
	•	How to set up an S3 bucket, IAM user policy, and required envs.
	•	How to switch Google auth on via AUTH_USE_GOOGLE=true.

Out of Scope (leave TODOs)
	•	AI parsing/insights, queues, webhooks.
	•	Direct integrations (Zoom/Google/IMAP).
	•	User-facing download/preview.
	•	Team/multi-tenant roles.

Definition of Done (Acceptance Criteria)
	•	I can sign up/sign in, land on /dashboard, and see the uploader.
	•	Selecting valid files produces presigned data; uploads show progress and complete.
	•	After completion, documents appear in the table with correct category, size, and timestamps.
	•	Invalid types or oversize are blocked on client and server with clear errors.
	•	API routes reject unauthenticated requests.
	•	Deleting a document hides it from the list (soft-delete).
	•	The app boots with only .env filled and runs npm run dev successfully.
