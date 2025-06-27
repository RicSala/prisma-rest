#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { parsePrismaSchema } from './parsers/prismaParser';
import { generateRoutesForModel } from './generators/routeGenerator';
import { generateRouteHandler } from './templates/routeTemplate';
import { GeneratorConfig } from './types';

const program = new Command();

program
  .name('prisma-rest')
  .description('Generate REST API routes for Next.js from Prisma schema')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate REST API routes from Prisma schema')
  .option(
    '-s, --schema <path>',
    'Path to Prisma schema file',
    './prisma/schema.prisma'
  )
  .option('-o, --output <path>', 'Output directory for generated routes')
  .option('-b, --base-url <url>', 'Base URL for API routes', '/api')
  .option(
    '--api-prefix <prefix>',
    'Additional path prefix for API routes (e.g., "rest" for /api/rest)'
  )
  .option(
    '-p, --prisma-import <path>',
    'Import path for Prisma client',
    '@/lib/prisma'
  )
  .option('--include <models...>', 'Include only specific models')
  .option('--exclude <models...>', 'Exclude specific models')
  .option('--force', 'Overwrite existing route files')
  .option('--skip-existing', 'Only generate routes for new models')
  .option('--dry-run', 'Show what would be generated without creating files')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Generating REST API routes...'));

      // Auto-detect if project uses /src directory
      const usesSrcDir = existsSync(resolve('./src'));
      const apiPrefix = options.apiPrefix ? `/${options.apiPrefix}` : '';
      const defaultOutputPath = usesSrcDir
        ? `./src/app/api${apiPrefix}`
        : `./app/api${apiPrefix}`;

      // Adjust default prisma import path based on src directory
      const defaultPrismaImport = '@/lib/prisma';

      const config: GeneratorConfig = {
        schemaPath: resolve(options.schema),
        outputPath: resolve(options.output || defaultOutputPath),
        baseUrl: options.baseUrl,
        prismaImportPath: options.prismaImport || defaultPrismaImport,
        includeModels: options.include,
        excludeModels: options.exclude,
      };

      // Check if schema file exists
      if (!existsSync(config.schemaPath)) {
        console.error(
          chalk.red(`L Prisma schema not found at: ${config.schemaPath}`)
        );
        process.exit(1);
      }

      // Parse schema
      const schema = await parsePrismaSchema(config.schemaPath);
      console.log(
        chalk.green(` Parsed ${schema.models.length} models from schema`)
      );

      // Filter models
      let models = schema.models;
      if (config.includeModels) {
        models = models.filter((m) => config.includeModels!.includes(m.name));
      }
      if (config.excludeModels) {
        models = models.filter((m) => !config.excludeModels!.includes(m.name));
      }

      // Track statistics
      let skippedCount = 0;
      let generatedCount = 0;
      const existingModels: string[] = [];

      // Generate routes for each model
      for (const model of models) {
        generateRoutesForModel(model, config.baseUrl);
        const modelDir = join(
          config.outputPath,
          model.name.toLowerCase() + 's'
        );
        const listCreatePath = join(modelDir, 'route.ts');
        const itemPath = join(modelDir, '[id]', 'route.ts');

        // Check if routes already exist
        const routesExist = existsSync(listCreatePath) || existsSync(itemPath);

        if (routesExist) {
          if (options.skipExisting) {
            console.log(
              chalk.yellow(`  ⏭️  Skipping existing routes for ${model.name}`)
            );
            skippedCount++;
            continue;
          } else if (!options.force) {
            console.log(
              chalk.red(`  ❌ Routes already exist for ${model.name}`)
            );
            existingModels.push(model.name);
            continue;
          }
        }

        console.log(
          chalk.cyan(
            `  ${options.dryRun ? '[DRY RUN]' : '✓'} Generating routes for ${
              model.name
            }...`
          )
        );

        if (!options.dryRun) {
          // Create directory structure
          mkdirSync(modelDir, { recursive: true });

          // Generate list/create route
          const listHandler = generateRouteHandler(
            model,
            'list',
            config.prismaImportPath
          );
          const createHandler = generateRouteHandler(
            model,
            'create',
            config.prismaImportPath
          );

          const combinedListCreate = addGeneratorHeader(
            combineHandlers(listHandler, createHandler)
          );
          writeFileSync(listCreatePath, combinedListCreate);

          // Generate get/update/delete route
          const itemDir = join(modelDir, '[id]');
          mkdirSync(itemDir, { recursive: true });

          const getHandler = generateRouteHandler(
            model,
            'get',
            config.prismaImportPath
          );
          const updateHandler = generateRouteHandler(
            model,
            'update',
            config.prismaImportPath
          );
          const deleteHandler = generateRouteHandler(
            model,
            'delete',
            config.prismaImportPath
          );

          const combinedItem = addGeneratorHeader(
            combineHandlers(getHandler, updateHandler, deleteHandler)
          );
          writeFileSync(itemPath, combinedItem);
        }

        generatedCount++;
      }

      // Summary messages
      if (options.dryRun) {
        console.log(
          chalk.blue(
            `\n🔍 DRY RUN: Would generate ${generatedCount} route${
              generatedCount !== 1 ? 's' : ''
            }`
          )
        );
      } else {
        console.log(
          chalk.green(
            `\n✅ Successfully generated ${generatedCount} route${
              generatedCount !== 1 ? 's' : ''
            }!`
          )
        );
      }

      if (skippedCount > 0) {
        console.log(
          chalk.yellow(
            `⏭️  Skipped ${skippedCount} existing route${
              skippedCount !== 1 ? 's' : ''
            }`
          )
        );
      }

      if (
        existingModels.length > 0 &&
        !options.force &&
        !options.skipExisting
      ) {
        console.log(
          chalk.red(
            `\n⚠️  Routes already exist for: ${existingModels.join(', ')}`
          )
        );
        console.log(
          chalk.yellow(
            `   Use --force to overwrite or --skip-existing to skip them`
          )
        );
      }

      if (!options.dryRun && generatedCount > 0) {
        console.log(
          chalk.yellow(
            `\n⚠️  Make sure you have a Prisma client instance at ${config.prismaImportPath}`
          )
        );
      }
    } catch (error) {
      console.error(chalk.red('L Error:'), error);
      process.exit(1);
    }
  });

program.parse();

function addGeneratorHeader(content: string): string {
  const version = '0.1.0'; // You might want to import this from package.json
  const timestamp = new Date().toISOString();
  const header = `// Generated by prisma-rest v${version}
// Generated at: ${timestamp}
// DO NOT MODIFY THIS COMMENT BLOCK

`;
  return header + content;
}

function combineHandlers(...handlers: string[]): string {
  // Extract imports (deduplicate)
  const imports = new Set<string>();
  const bodies: string[] = [];

  for (const handler of handlers) {
    const lines = handler.split('\n');
    const importLines: string[] = [];
    const bodyLines: string[] = [];

    let inImports = true;
    for (const line of lines) {
      if (inImports && (line.startsWith('import') || line.trim() === '')) {
        if (line.trim()) importLines.push(line);
      } else {
        inImports = false;
        bodyLines.push(line);
      }
    }

    importLines.forEach((imp) => imports.add(imp));
    bodies.push(bodyLines.join('\n').trim());
  }

  return Array.from(imports).join('\n') + '\n\n' + bodies.join('\n\n');
}
