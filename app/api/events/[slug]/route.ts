import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { Event } from "@/database";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    await connectDB();

    const { slug } = await params;

    // Validate slug presence
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return NextResponse.json(
        { message: "Slug is required" },
        { status: 400 }
      );
    }

    const trimmedSlug = slug.trim();

    // Validate slug format (URL-friendly)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmedSlug)) {
      return NextResponse.json(
        { message: "Invalid slug format" },
        { status: 400 }
      );
    }

    // Query event by slug
    const event = await Event.findOne({ slug: trimmedSlug }).lean();

    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Event fetched successfully", event },
      { status: 200 }
    );
  } catch (e) {
    console.error("Event fetch by slug error:", e);
    return NextResponse.json(
      {
        message: "Failed to fetch event",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
