import { ParsedModel } from '../parsers/prismaParser'

export function generateRouteHandler(model: ParsedModel, operation: string, prismaImportPath: string = '@/lib/prisma'): string {
  const modelNameLower = model.name.toLowerCase()
  const idField = model.fields.find(f => f.isId)?.name || 'id'
  
  switch (operation) {
    case 'list':
      return generateListHandler(model, prismaImportPath)
    case 'get':
      return generateGetHandler(model, idField, prismaImportPath)
    case 'create':
      return generateCreateHandler(model, prismaImportPath)
    case 'update':
      return generateUpdateHandler(model, idField, prismaImportPath)
    case 'delete':
      return generateDeleteHandler(model, idField, prismaImportPath)
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

function generateListHandler(model: ParsedModel, prismaImportPath: string): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '${prismaImportPath}'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.${modelNameLower(model.name)}.findMany({
        skip,
        take: limit,
      }),
      prisma.${modelNameLower(model.name)}.count(),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ${model.name.toLowerCase()}s' },
      { status: 500 }
    )
  }
}`
}

function generateGetHandler(model: ParsedModel, idField: string, prismaImportPath: string): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '${prismaImportPath}'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.${modelNameLower(model.name)}.findUnique({
      where: { ${idField}: params.id },
    })

    if (!item) {
      return NextResponse.json(
        { error: '${model.name} not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ${model.name.toLowerCase()}' },
      { status: 500 }
    )
  }
}`
}

function generateCreateHandler(model: ParsedModel, prismaImportPath: string): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '${prismaImportPath}'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const item = await prisma.${modelNameLower(model.name)}.create({
      data: body,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create ${model.name.toLowerCase()}' },
      { status: 500 }
    )
  }
}`
}

function generateUpdateHandler(model: ParsedModel, idField: string, prismaImportPath: string): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '${prismaImportPath}'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const item = await prisma.${modelNameLower(model.name)}.update({
      where: { ${idField}: params.id },
      data: body,
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update ${model.name.toLowerCase()}' },
      { status: 500 }
    )
  }
}`
}

function generateDeleteHandler(model: ParsedModel, idField: string, prismaImportPath: string): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '${prismaImportPath}'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.${modelNameLower(model.name)}.delete({
      where: { ${idField}: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete ${model.name.toLowerCase()}' },
      { status: 500 }
    )
  }
}`
}

function modelNameLower(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1)
}