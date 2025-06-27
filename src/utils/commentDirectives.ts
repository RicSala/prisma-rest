export interface RestDirectives {
  skip?: boolean
  // Future directives can be added here
  // e.g., customPath?: string
  // e.g., methods?: string[]
}

/**
 * Parse REST directives from Prisma model documentation
 * Looks for @rest-* directives in the documentation
 */
export function parseRestDirectives(documentation?: string): RestDirectives {
  if (!documentation) {
    return {}
  }

  const directives: RestDirectives = {}
  
  // Check for @rest-skip
  if (/@rest-skip/i.test(documentation)) {
    directives.skip = true
  }
  
  // Future directives can be parsed here
  // e.g., @rest-path /custom/path
  // e.g., @rest-methods GET,POST
  
  return directives
}