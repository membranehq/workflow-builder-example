import { z } from 'zod'
import { DataSchema } from '@membranehq/react'
import { parseSchema } from 'json-schema-to-zod'

/**
 * Converts a JSON Schema to a Zod schema using json-schema-to-zod library
 */
export function jsonSchemaToZod(schema: DataSchema): z.ZodType<unknown> {
  // Handle null or empty schema
  if (!schema) {
    return z.any()
  }

  try {
    // Convert the schema to a Zod schema string
    const zodSchemaString = parseSchema(schema)

    // Extract the schema definition from the generated string
    // The library returns something like "z.object({ ... })"
    // We need to evaluate it to get the actual Zod schema
    const zodSchemaCode = zodSchemaString
      .replace(/^import.*\n*/gm, '') // Remove import statements
      .replace(/^export.*z\./, 'z.') // Remove export statement
      .trim()

    // Use Function constructor to evaluate the Zod schema code
    // This is safe because we control the input (JSON schema) and the library output
    const createSchema = new Function('z', `return ${zodSchemaCode}`)
    return createSchema(z)
  } catch (error) {
    console.error('Failed to convert JSON schema to Zod:', error)
    // Fallback to a basic object schema
    return z.object({})
  }
}
