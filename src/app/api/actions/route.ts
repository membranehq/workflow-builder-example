import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  try {
    const { connectionId, collectionKey, method, input, parameters } = await req.json()
    const { db } = await connectToDatabase()

    const result = await db.collection("actions").insertOne({
      connectionId,
      collectionKey,
      method,
      input,
      parameters,
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Failed to save action:", error)
    return NextResponse.json(
      { error: "Failed to save action" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    const actions = await db
      .collection("actions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(actions)
  } catch (error) {
    console.error("Failed to fetch actions:", error)
    return NextResponse.json(
      { error: "Failed to fetch actions" },
      { status: 500 }
    )
  }
} 