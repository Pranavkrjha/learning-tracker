import { NextResponse } from 'next/server'
import { getContinueLearning } from '@/lib/services/continueLearning'

export async function GET() {
  try {
    const data = await getContinueLearning()
    if (!data) return NextResponse.json(null)
    return NextResponse.json(data)
  } catch (err) {
    // Not authenticated or other error — return null silently
    return NextResponse.json(null, { status: 200 })
  }
}
