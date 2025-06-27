import { ParsedModel } from '../parsers/prismaParser'
import { GeneratedRoute } from '../types'

export function generateRoutesForModel(model: ParsedModel, baseUrl: string = '/api'): GeneratedRoute[] {
  const routes: GeneratedRoute[] = []
  const modelNameLower = model.name.toLowerCase()
  const modelNamePlural = `${modelNameLower}s` // Simple pluralization
  
  // List all
  routes.push({
    path: `${baseUrl}/${modelNamePlural}`,
    method: 'GET',
    handler: `list${model.name}`,
    model: model.name,
    operation: 'list'
  })
  
  // Get one
  routes.push({
    path: `${baseUrl}/${modelNamePlural}/[id]`,
    method: 'GET',
    handler: `get${model.name}`,
    model: model.name,
    operation: 'get'
  })
  
  // Create
  routes.push({
    path: `${baseUrl}/${modelNamePlural}`,
    method: 'POST',
    handler: `create${model.name}`,
    model: model.name,
    operation: 'create'
  })
  
  // Update
  routes.push({
    path: `${baseUrl}/${modelNamePlural}/[id]`,
    method: 'PUT',
    handler: `update${model.name}`,
    model: model.name,
    operation: 'update'
  })
  
  // Delete
  routes.push({
    path: `${baseUrl}/${modelNamePlural}/[id]`,
    method: 'DELETE',
    handler: `delete${model.name}`,
    model: model.name,
    operation: 'delete'
  })
  
  return routes
}