# Yconic Autonomous - Document Uploader

A Next.js application for uploading and managing documents with S3 storage and MongoDB persistence. Supports Zoom notes, calendar data, and email archives with AI-ready processing hooks.

## Features

- **Authentication**: NextAuth.js with credentials and optional Google OAuth
- **File Upload**: Drag-and-drop interface with S3 presigned uploads
- **Document Management**: List, view, and soft-delete uploaded documents
- **File Validation**: Strict MIME type and extension validation
- **Rate Limiting**: Built-in protection against abuse
- **Responsive UI**: Clean, modern interface built with Tailwind CSS

## Supported File Types

### Zoom Notes
- `.txt` - Plain text files
- `.md` - Markdown files  
- `.pdf` - PDF documents
- `.docx` - Microsoft Word documents

### Calendar Data
- `.ics` - iCalendar files
- `.csv` - Comma-separated values

### Email Archives
- `.eml` - Email message files
- `.mbox` - Mailbox files
- `.txt` - Plain text email exports

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **Storage**: Amazon S3
- **Testing**: Vitest
- **Validation**: Zod

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- AWS S3 bucket
- AWS IAM user with S3 permissions

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd uploader
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/
MONGODB_TABLE=yconic_autonomous

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
S3_PUBLIC_BASE_URL=https://your-bucket-name.s3.amazonaws.com

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AUTH_USE_GOOGLE=false
```

### 3. Database Setup

#### Local MongoDB with Docker

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI`

### 4. S3 Setup

#### Create S3 Bucket

1. Go to AWS S3 Console
2. Create a new bucket (e.g., `yconic-autonomous-dev`)
3. Configure bucket settings:
   - **Block Public Access**: Keep enabled for security
   - **Versioning**: Optional
   - **Encryption**: Recommended

#### Create IAM User

1. Go to AWS IAM Console
2. Create a new user (e.g., `yconic-uploader`)
3. Attach the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

4. Generate access keys and add to your `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── upload/       # File upload endpoints
│   │   └── documents/     # Document management endpoints
│   ├── auth/              # Auth pages (signin, signup)
│   ├── dashboard/         # Protected dashboard
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── AuthGuard.tsx      # Route protection
│   ├── DocumentsTable.tsx # Document listing
│   ├── NavBar.tsx         # Navigation
│   └── Uploader.tsx       # File upload interface
├── hooks/                 # Custom React hooks
│   └── useUploader.ts     # Upload logic
├── lib/                   # Utilities and configurations
│   ├── auth/             # NextAuth configuration
│   ├── db/               # Database models and connection
│   ├── s3/               # S3 utilities
│   ├── uploads/          # File validation
│   └── utils/            # General utilities
└── __tests__/            # Test files
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### File Upload
- `POST /api/upload/create-presigned` - Get S3 presigned URLs
- `POST /api/upload/complete` - Complete upload process

### Document Management
- `GET /api/documents/list` - List user documents (paginated)
- `POST /api/documents/delete` - Soft delete document

## Security Features

- **Authentication Required**: All API routes require valid session
- **File Validation**: Strict MIME type and extension checking
- **Size Limits**: Configurable file size limits (default 25MB)
- **Rate Limiting**: Token bucket rate limiting on upload endpoints
- **S3 Security**: Private bucket with presigned URLs only
- **Input Sanitization**: Zod schema validation on all inputs

## Configuration

### Upload Limits

- **Max file size**: Set via `MAX_UPLOAD_MB` (default: 25MB)
- **Allowed MIME types**: Configure via `ALLOWED_MIME_LIST`
- **Rate limiting**: Adjustable in `src/lib/utils/rateLimit.ts`

### Authentication

- **Credentials**: Email/password authentication
- **Google OAuth**: Enable with `AUTH_USE_GOOGLE=true`
- **Session strategy**: JWT tokens (configurable)

## Testing

Run the test suite:

```bash
npm run test
```

Tests cover:
- File validation utilities
- Byte formatting functions
- Rate limiting logic
- API route validation

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

1. Build the application: `npm run build`
2. Set environment variables
3. Deploy the `.next` folder and `package.json`

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Verify `MONGODB_URI` is correct
- Check MongoDB is running (local) or accessible (cloud)
- Ensure database name is included in URI

**S3 Upload Failures**
- Verify AWS credentials are correct
- Check S3 bucket exists and is accessible
- Ensure IAM user has required permissions

**Authentication Issues**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- For Google OAuth, verify client ID/secret

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

**Note**: This is a development version. For production use, ensure proper password hashing, HTTPS, and additional security measures are implemented.
