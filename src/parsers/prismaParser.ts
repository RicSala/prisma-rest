import { getDMMF } from '@prisma/internals'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export interface ParsedModel {
  name: string
  documentation?: string
  fields: Array<{
    name: string
    type: string
    isList: boolean
    isRequired: boolean
    isId: boolean
    isUnique: boolean
    documentation?: string
    relationName?: string
    relationFromFields?: string[]
    relationToFields?: string[]
  }>
}

export interface ParsedSchema {
  models: ParsedModel[]
  enums: Array<{
    name: string
    values: string[]
  }>
}

export async function parsePrismaSchema(schemaPath: string): Promise<ParsedSchema> {
  const absolutePath = resolve(schemaPath)
  const schemaContent = readFileSync(absolutePath, 'utf-8')
  
  const dmmf = await getDMMF({ datamodel: schemaContent })
  
  const models: ParsedModel[] = dmmf.datamodel.models.map(model => ({
    name: model.name,
    documentation: model.documentation,
    fields: model.fields.map(field => ({
      name: field.name,
      type: field.type,
      isList: field.isList,
      isRequired: field.isRequired,
      isId: field.isId,
      isUnique: field.isUnique,
      documentation: field.documentation,
      relationName: field.relationName,
      relationFromFields: field.relationFromFields ? [...field.relationFromFields] : undefined,
      relationToFields: field.relationToFields ? [...field.relationToFields] : undefined,
    }))
  }))
  
  const enums = dmmf.datamodel.enums.map(enum_ => ({
    name: enum_.name,
    values: enum_.values.map(v => v.name)
  }))
  
  return { models, enums }
}