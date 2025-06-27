# prisma-rest

Generate REST API routes automatically from your Prisma schema for Next.js App Router.

## Features

- 🚀 **Instant REST API** - Generate CRUD endpoints from your Prisma models
- 📁 **Next.js App Router** - Built for the modern Next.js app directory structure
- 🔧 **Flexible Configuration** - Customize paths, imports, and behavior
- 🎯 **Smart Defaults** - Auto-detects project structure and follows conventions
- 🔄 **Safe Regeneration** - Multiple strategies for updating existing routes
- 📝 **TypeScript First** - Fully typed route handlers with proper Next.js types

## Installation

```bash
npm install -D prisma-rest
# or
yarn add -D prisma-rest
# or
pnpm add -D prisma-rest
```

## Quick Start

1. Ensure you have a Prisma schema in your Next.js project:

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. Generate your REST API routes:

```bash
npx prisma-rest generate
```

3. Create your Prisma client instance:

```typescript
// lib/prisma.ts (or src/lib/prisma.ts)
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

That's it! Your REST API is ready at:

- `GET /api/users` - List all users with pagination
- `POST /api/users` - Create a new user
- `GET /api/users/[id]` - Get a specific user
- `PUT /api/users/[id]` - Update a user
- `DELETE /api/users/[id]` - Delete a user

## Generated Routes

For each Prisma model, the generator creates:

### List & Create Routes (`/api/[model]s/route.ts`)

```typescript
// GET /api/users - List with pagination
// Query params: ?page=1&limit=10
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}

// POST /api/users - Create new resource
// Body: { "email": "user@example.com", "name": "John Doe" }
```

### Individual Resource Routes (`/api/[model]s/[id]/route.ts`)

```typescript
// GET /api/users/[id] - Get single resource
// PUT /api/users/[id] - Update resource
// DELETE /api/users/[id] - Delete resource
```

## CLI Options

```bash
prisma-rest generate [options]

Options:
  -s, --schema <path>         Path to Prisma schema file (default: "./prisma/schema.prisma")
  -o, --output <path>         Output directory for generated routes
  -b, --base-url <url>        Base URL for API routes (default: "/api")
  --api-prefix <prefix>       Additional path prefix (e.g., "rest" for /api/rest)
  -p, --prisma-import <path>  Import path for Prisma client (default: "@/lib/prisma")
  --include <models...>       Include only specific models
  --exclude <models...>       Exclude specific models
  --force                     Overwrite existing route files
  --skip-existing             Only generate routes for new models
  --dry-run                   Preview what would be generated
  -h, --help                  Display help
```

## Examples

### Custom Output Directory

```bash
# Generate in a custom directory
prisma-rest generate --output ./src/app/api/v2

# Generate with a prefix
prisma-rest generate --api-prefix rest
# Creates routes at /api/rest/users, /api/rest/posts, etc.
```

### Custom Prisma Import

```bash
# If your Prisma client is in a different location
prisma-rest generate --prisma-import "@/server/db"
```

### Selective Generation

```bash
# Only generate routes for specific models
prisma-rest generate --include User Post

# Generate all except certain models
prisma-rest generate --exclude Log Audit
```

### Safe Regeneration

```bash
# Preview changes without creating files
prisma-rest generate --dry-run

# Skip existing files (only add new models)
prisma-rest generate --skip-existing

# Force overwrite all files
prisma-rest generate --force
```

## Project Structure Support

The generator automatically detects your project structure:

- ✅ Supports `/src` directory layouts
- ✅ Detects App Router at `/app` or `/src/app`
- ✅ Understands Next.js path aliases (`@/`)

## Generated Code Features

- **TypeScript** - Fully typed with Next.js route handler types
- **Error Handling** - Consistent error responses with appropriate status codes
- **Pagination** - Built-in pagination for list endpoints
- **Async/Await** - Modern async patterns throughout
- **Prisma Best Practices** - Efficient queries and proper error handling

## Requirements

- Next.js 13+ with App Router
- Prisma 4+
- TypeScript (recommended)

## Advanced Usage

### Customizing Generated Routes

After generation, you can modify the routes to add:

- Authentication middleware
- Input validation
- Custom business logic
- Response transformations

The generated files include a header comment to track generation metadata.

### Integration with Authentication

Example of adding auth to generated routes:

```typescript
import { withAuth } from '@/lib/auth';

// Wrap the generated handler
export const GET = withAuth(async (request: NextRequest) => {
  // Generated code...
});
```

## Troubleshooting

### "Cannot find module '@/lib/prisma'"

Ensure you've created the Prisma client instance at the correct location. The default import path is `@/lib/prisma`, but you can customize it with the `--prisma-import` flag.

### Routes Already Exist

By default, the generator won't overwrite existing files. Use:

- `--force` to overwrite
- `--skip-existing` to only generate new models
- `--dry-run` to preview changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Your Name]

---

Made with ❤️ for the Next.js + Prisma community
