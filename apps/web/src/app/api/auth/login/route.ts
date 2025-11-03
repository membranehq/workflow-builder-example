import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Generate a random user ID
    const userId = randomUUID();

    // Create response with user data
    const response = NextResponse.json(
      {
        user: { id: userId, email },
        message: "Authentication successful",
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with user data (never expire)
    const userData = JSON.stringify({ id: userId, email });

    response.cookies.set("app-auth", userData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
