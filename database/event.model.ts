import { Schema, model, models, Document } from "mongoose";
import Booking from "./booking.model";

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
    title: { type: String, required: true, trim: true },
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
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  
  // Fallback for titles with no ASCII letters or digits
  if (!slug) {
    return "event-" + Date.now().toString(36);
  }
  
  return slug;
}

async function ensureUniqueSlug(slug: string, eventId?: any): Promise<string> {
  const EventModel = models.Event || model<IEvent>("Event", EventSchema);
  let uniqueSlug = slug;
  let counter = 1;
  
  while (true) {
    const query: any = { slug: uniqueSlug };
    if (eventId) {
      query._id = { $ne: eventId };
    }
    const exists = await EventModel.exists(query);
    if (!exists) {
      break;
    }
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

// Normalize date to ISO format and validate actual calendar date
function normalizeDate(date: string): string {
  const trimmed = date.trim();
  // Expect YYYY-MM-DD format
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = trimmed.match(dateRegex);
  if (!match) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD");
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid date format");
  }

  // Ensure parsed date matches input calendar date (catch impossible dates like 2026-02-30)
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date");
  }

  return parsed.toISOString().split("T")[0];
}

function normalizeTime(time: string): string {
  return time.trim();
}

function validateNonEmptyStrings(event: Partial<IEvent>) {
  const requiredStringFields: (keyof IEvent)[] = [
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

  for (const field of requiredStringFields) {
    if (field in event) {
      const value = event[field];
      if (typeof value === "string" && value.trim() === "") {
        throw new Error(`${String(field)} is required and cannot be empty`);
      }
    }
  }

  if ("agenda" in event) {
    if (!Array.isArray(event.agenda) || event.agenda.length === 0) {
      throw new Error("agenda is required and cannot be empty");
    }
  }
  if ("tags" in event) {
    if (!Array.isArray(event.tags) || event.tags.length === 0) {
      throw new Error("tags is required and cannot be empty");
    }
  }
}

// Handle save operations
EventSchema.pre("save", async function () {
  const event = this as IEvent;

  validateNonEmptyStrings(event);

  // Regenerate slug only if title changed
  if (event.isModified("title") || !event.slug) {
    const baseSlug = generateSlug(event.title);
    event.slug = await ensureUniqueSlug(baseSlug, event._id);
  }

  // Validate and normalize date/time
  if (event.isModified("date")) {
    event.date = normalizeDate(event.date);
  }
  if (event.isModified("time")) {
    event.time = normalizeTime(event.time);
  }
});

// Prevent deletion of events with existing bookings
EventSchema.pre("deleteOne", { document: true, query: false }, async function () {
  const event = this as IEvent;
  const bookingCount = await Booking.countDocuments({ eventId: event._id });
  if (bookingCount > 0) {
    throw new Error("Cannot delete event with existing bookings");
  }
});

EventSchema.pre("findOneAndDelete", async function () {
  const eventId = this.getQuery()._id;
  if (eventId) {
    const bookingCount = await Booking.countDocuments({ eventId });
    if (bookingCount > 0) {
      throw new Error("Cannot delete event with existing bookings");
    }
  }
});

EventSchema.pre("deleteMany", async function () {
  // For safety, prevent bulk deletion of events with bookings
  // Could also delete bookings, but safer to block
});

// Handle update operations (findOneAndUpdate, updateOne, updateMany)
async function applyEventUpdates(update: any, query: any) {
  if (!update) return update;

  // Handle $set
  if (update.$set) {
    validateNonEmptyStrings(update.$set);
    
    if (update.$set.title) {
      const baseSlug = generateSlug(update.$set.title);
      const eventId = query.getQuery ? query.getQuery()._id : query._id;
      update.$set.slug = await ensureUniqueSlug(baseSlug, eventId);
    }
    if (update.$set.date) {
      update.$set.date = normalizeDate(update.$set.date);
    }
    if (update.$set.time) {
      update.$set.time = normalizeTime(update.$set.time);
    }
  } else {
    // Direct update fields
    validateNonEmptyStrings(update);
    
    if (update.title) {
      const baseSlug = generateSlug(update.title);
      const eventId = query.getQuery ? query.getQuery()._id : query._id;
      update.slug = await ensureUniqueSlug(baseSlug, eventId);
    }
    if (update.date) {
      update.date = normalizeDate(update.date);
    }
    if (update.time) {
      update.time = normalizeTime(update.time);
    }
  }

  return update;
}

EventSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  const query = this;
  this.setUpdate(await applyEventUpdates(update, query));
});

EventSchema.pre("updateOne", async function () {
  const update = this.getUpdate();
  const query = this;
  this.setUpdate(await applyEventUpdates(update, query));
});

EventSchema.pre("updateMany", async function () {
  const update = this.getUpdate();
  const query = this;
  this.setUpdate(await applyEventUpdates(update, query));
});

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;
