import { Schema, model, models, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { 
              type: String,
              required: true, 
              trim: true 
            },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true },
  },
  { timestamps: true }
);

// Ensure unique index on slug
EventSchema.index({ slug: 1 }, { unique: true });

// Generate URL-friendly slug from title if missing or title changed
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Normalize date to ISO format if possible, keep consistent time format
function normalizeDate(date: string): string {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid date format");
  }
  return parsed.toISOString().split("T")[0];
}

function normalizeTime(time: string): string {
  // Keep simple normalization - trim whitespace
  return time.trim();
}

EventSchema.pre("save", function () {
  const event = this as IEvent;

  // Validate required non-empty fields
  const requiredFields: (keyof IEvent)[] = [
    "title",
    "description",
    "overview",
    "image",
    "venue",
    "location",
    "date",
    "time",
    "mode",
    "audience",
    "organizer",
  ];

  for (const field of requiredFields) {
    const value = event[field];
    if (typeof value === "string" && value.trim() === "") {
      throw new Error(`${String(field)} is required and cannot be empty`);
    }
  }

  if (!Array.isArray(event.agenda) || event.agenda.length === 0) {
    throw new Error("agenda is required and cannot be empty");
  }
  if (!Array.isArray(event.tags) || event.tags.length === 0) {
    throw new Error("tags is required and cannot be empty");
  }

  // Regenerate slug only if title changed
  if (event.isModified("title") || !event.slug) {
    event.slug = generateSlug(event.title);
  }

  // Validate and normalize date/time
  if (event.isModified("date")) {
    event.date = normalizeDate(event.date);
  }
  if (event.isModified("time")) {
    event.time = normalizeTime(event.time);
  }
});

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;
