# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`prisma-rest` is a CLI tool that generates REST API routes for Next.js applications from Prisma schemas. It reads Prisma schema files and creates fully functional CRUD endpoints following Next.js App Router conventions.

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

### Publishing
```bash
pnpm run build              # Build before publishing
pnpm publish --dry-run      # Preview what will be published
pnpm publish                # Publish to npm
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
3. **Comment Directives** (`src/utils/commentDirectives.ts`) → Parses special commands from model documentation
4. **Route Generator** (`src/generators/routeGenerator.ts`) → Creates route configurations
5. **Template Engine** (`src/templates/routeTemplate.ts`) → Generates TypeScript code
6. **File Writer** → Creates route files in Next.js app directory

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

## Comment Directives

The tool supports special comments in Prisma schema for controlling generation:

### @rest-skip
Models with `@rest-skip` in their documentation are skipped:
```prisma
/// Internal model - not exposed via API
/// @rest-skip
model AuditLog {
  id String @id
}
```

### Future Directives (Extensibility)
The `parseRestDirectives` function is designed to support future directives like:
- `@rest-path /custom/path` - Custom API endpoint
- `@rest-methods GET,POST` - Only generate specific methods
- `@rest-auth required` - Authentication requirements

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

### Documentation Preservation
The parser captures Prisma schema documentation (triple-slash comments) in the DMMF. This is available via `model.documentation` and `field.documentation` for future features.

## Package Configuration

### Key Dependencies
- **Commander**: CLI framework
- **Chalk**: Terminal styling
- **@prisma/internals**: Access to Prisma's DMMF parser
- All bundled into dist files using tsup

### Peer Dependencies
- Next.js >=14.0.0
- React >=18.0.0
- Prisma >=5.0.0
- @prisma/client >=5.0.0

### Files Structure
```
src/
├── cli.ts                    # CLI entry point
├── index.ts                  # Library exports
├── parsers/
│   └── prismaParser.ts       # Schema parsing with DMMF
├── generators/
│   └── routeGenerator.ts     # Route configuration logic
├── templates/
│   └── routeTemplate.ts      # TypeScript code generation
├── types/
│   └── index.ts              # TypeScript interfaces
└── utils/
    └── commentDirectives.ts  # Parse @rest-* directives
```

## Development Tips

### Adding New CLI Options
1. Add option in `src/cli.ts` using Commander
2. Update `GeneratorConfig` interface in `src/types/index.ts`
3. Handle the option in the generation logic

### Adding New Comment Directives
1. Update `RestDirectives` interface in `src/utils/commentDirectives.ts`
2. Add parsing logic in `parseRestDirectives` function
3. Handle the directive in `src/cli.ts` generation loop

### Modifying Generated Code
Edit templates in `src/templates/routeTemplate.ts`. Each operation has its own generator function.

### Testing Changes
Use the `test-app` directory which has a full Next.js setup with Prisma configured. The test app uses `file:../` dependency to test local changes.

### Common Issues

#### WASM File Missing
If you see "Cannot find module prisma_schema_build_bg.wasm":
- Ensure `pnpm run build` was executed
- Check that `copy-wasm` script ran successfully
- Verify the WASM file exists in dist/

#### Package Name Mismatch
The package was renamed from `prisma-rest-generator` to `prisma-rest`. Ensure consistency in:
- package.json name field
- CLI binary name
- Import statements
- Documentation references