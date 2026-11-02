import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import connectDB from "@/lib/mongodb";
import { Event } from "@/database";

export async function POST(req: NextRequest) {
  let uploadResult: any = null;
  try {
    await connectDB();

    const formData = await req.formData();

    let event: Record<string, unknown> = {};

    try {
      event = Object.fromEntries(formData.entries());
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid JSON data format" },
        { status: 400 }
      );
    }

    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 }
      );
    }

    // Validate required fields before upload
    const requiredFields = [
      "title",
      "description",
      "overview",
      "venue",
      "location",
      "date",
      "time",
      "mode",
      "audience",
      "organizer",
    ];
    for (const field of requiredFields) {
      if (!event[field] || (typeof event[field] === "string" && (event[field] as string).trim() === "")) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    let tags: string[] = [];
    let agenda: string[] = [];
    try {
      const tagsRaw = formData.get("tags");
      const agendaRaw = formData.get("agenda");
      if (tagsRaw === null) throw new Error("tags missing");
      if (agendaRaw === null) throw new Error("agenda missing");
      if (Array.isArray(tagsRaw)) {
        tags = tagsRaw as string[];
      } else if (typeof tagsRaw === "string") {
        try {
          const parsed = JSON.parse(tagsRaw);
          tags = Array.isArray(parsed) ? parsed : tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean);
        } catch {
          tags = tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean);
        }
      } else {
        tags = [];
      }
      if (Array.isArray(agendaRaw)) {
        agenda = agendaRaw as string[];
      } else if (typeof agendaRaw === "string") {
        try {
          const parsed = JSON.parse(agendaRaw);
          agenda = Array.isArray(parsed) ? parsed : agendaRaw.split(",").map((a: string) => a.trim()).filter(Boolean);
        } catch {
          agenda = agendaRaw.split(",").map((a: string) => a.trim()).filter(Boolean);
        }
      } else {
        agenda = [];
      }
    } catch {
      return NextResponse.json(
        { message: "tags and agenda must be valid JSON arrays" },
        { status: 400 }
      );
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ message: "tags are required" }, { status: 400 });
    }
    if (!Array.isArray(agenda) || agenda.length === 0) {
      return NextResponse.json({ message: "agenda is required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "DevEvents" },
          (error, results) => {
            if (error) return reject(error);
            resolve(results);
          }
        )
        .end(buffer);
    });

    event.image = (uploadResult as { secure_url: string }).secure_url;

    const createdEvent = await Event.create({
      ...event,
      tags: tags,
      agenda: agenda,
    });

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (e) {
    // Clean up uploaded image if creation failed
    if (uploadResult && (uploadResult as any).public_id) {
      try {
        await cloudinary.uploader.destroy((uploadResult as any).public_id);
      } catch (cleanupErr) {
        console.error("Failed to cleanup uploaded image:", cleanupErr);
      }
    }
    console.error(e);
    return NextResponse.json(
      { message: "Event Creation Failed", error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Event fetching failed", error: e },
      { status: 500 }
    );
  }
}
