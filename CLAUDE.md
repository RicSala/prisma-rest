# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`prisma-rest-generator` is a CLI tool that generates REST API routes for Next.js applications from Prisma schemas. It reads Prisma schema files and creates fully functional CRUD endpoints following Next.js App Router conventions.

## Common Commands

### Development
```bash
pnpm dev                    # Run CLI in development mode with tsx
pnpm build                  # Build distribution files (includes WASM copy)
pnpm typecheck             # Run TypeScript type checking
```

### Using the CLI
```bash
# Generate routes with default settings
pnpm prisma-rest generate

# Common options
pnpm prisma-rest generate --force              # Overwrite existing files
pnpm prisma-rest generate --skip-existing      # Only generate new models
pnpm prisma-rest generate --dry-run            # Preview without creating files
pnpm prisma-rest generate --prisma-import "@/lib/prisma"  # Custom Prisma import path
pnpm prisma-rest generate --api-prefix "rest"  # Generate at /api/rest/*
```

### Testing in the test-app
```bash
cd test-app
pnpm prisma-rest generate   # Uses the local library via file: dependency
```

## Architecture & Key Concepts

### Build Process & WASM Handling
The build process has a critical dependency on Prisma's WASM file:
1. `tsup` bundles the TypeScript code
2. `copy-wasm` script copies `prisma_schema_build_bg.wasm` from node_modules to dist
3. This WASM file is required for schema parsing at runtime

If you modify the build process, ensure the WASM file is always copied.

### Code Generation Flow
1. **CLI Entry** (`src/cli.ts`) → Parses command options
2. **Schema Parser** (`src/parsers/prismaParser.ts`) → Uses Prisma's DMMF to parse schema
3. **Route Generator** (`src/generators/routeGenerator.ts`) → Creates route configurations
4. **Template Engine** (`src/templates/routeTemplate.ts`) → Generates TypeScript code
5. **File Writer** → Creates route files in Next.js app directory

### Generated Route Structure
For each Prisma model, generates:
- `/api/[models]/route.ts` - LIST (GET) and CREATE (POST) operations
- `/api/[models]/[id]/route.ts` - GET, UPDATE (PUT), DELETE operations

### Smart Defaults
- Auto-detects `/src` directory and adjusts output paths
- Understands that `@` alias points to `/src` when present
- Defaults to `@/lib/prisma` for Prisma client import

### File Regeneration Strategy
The tool tracks existing files and provides three strategies:
- Default: Warns about existing files, doesn't overwrite
- `--force`: Overwrites all existing files
- `--skip-existing`: Only generates files for new models

Generated files include a header comment with version and timestamp for tracking.

## Important Implementation Details

### Model Name Pluralization
Currently uses simple pluralization (adds 's'). When modifying:
- `User` → `users`
- `Post` → `posts`
This may need enhancement for irregular plurals.

### ID Field Detection
Dynamically finds the field marked with `@id` in Prisma schema. Falls back to 'id' if not found. Used in single-resource routes.

### Error Handling Pattern
Generated routes use consistent error handling:
```typescript
try {
  // Operation
} catch (error) {
  return NextResponse.json(
    { error: 'Failed to [operation] [model]' },
    { status: 500 }
  )
}
```

### Pagination Support
LIST endpoints automatically include pagination:
- Query params: `page` (default: 1), `limit` (default: 10)
- Response includes: `items`, `total`, `page`, `limit`, `totalPages`

## Development Tips

### Adding New CLI Options
1. Add option in `src/cli.ts` using Commander
2. Update `GeneratorConfig` interface in `src/types/index.ts`
3. Handle the option in the generation logic

### Modifying Generated Code
Edit templates in `src/templates/routeTemplate.ts`. Each operation has its own generator function.

### Testing Changes
Use the `test-app` directory which has a full Next.js setup with Prisma configured. The test app uses `file:../` dependency to test local changes.