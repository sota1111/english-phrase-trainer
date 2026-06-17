import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function parseJson<T>(request: NextRequest, schema: z.ZodSchema<T>) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return {
        success: false as const,
        response: NextResponse.json(
          { error: 'Invalid request', details: result.error.format() },
          { status: 400 }
        ),
      };
    }
    return {
      success: true as const,
      data: result.data,
    };
  } catch {
    return {
      success: false as const,
      response: NextResponse.json(
        { error: 'Invalid request', details: 'Malformed JSON' },
        { status: 400 }
      ),
    };
  }
}
