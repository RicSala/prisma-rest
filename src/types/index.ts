export interface GeneratorConfig {
  schemaPath: string
  outputPath: string
  baseUrl?: string
  prismaImportPath?: string
  includeModels?: string[]
  excludeModels?: string[]
  customHandlers?: Record<string, string>
}

export interface RouteConfig {
  model: string
  operations: ('list' | 'get' | 'create' | 'update' | 'delete')[]
  middleware?: string[]
}

export interface GeneratedRoute {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  handler: string
  model: string
  operation: string
}