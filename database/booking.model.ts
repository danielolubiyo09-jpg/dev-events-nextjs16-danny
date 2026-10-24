import { Schema, model, models, Document, Types, ClientSession } from "mongoose";
import Event from "./event.model";

export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

// Unique compound index to prevent duplicate bookings per event per email
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

// Email validation - reject consecutive dots and invalid forms
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  // Reject consecutive dots
  if (email.includes("..")) {
    return false;
  }
  // Check domain labels are not empty
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split(".");
  if (domainParts.some((part) => part.length === 0)) {
    return false;
  }
  return true;
}

async function validateBookingAtomic(
  booking: IBooking | Partial<IBooking>,
  session: ClientSession
) {
  // Validate email format
  if ("email" in booking && typeof booking.email === "string") {
    if (!isValidEmail(booking.email)) {
      throw new Error("Invalid email format");
    }
    booking.email = booking.email.trim().toLowerCase();
  }

  // Verify referenced event exists atomically within transaction
  if ("eventId" in booking && booking.eventId) {
    const event = await Event.findById(booking.eventId)
      .session(session)
      .exec();
    if (!event) {
      throw new Error("Referenced event does not exist");
    }
  }
}

// Use transaction to make check and insert atomic
BookingSchema.pre("save", async function () {
  const booking = this as IBooking;
  const db = booking.db;
  const session = await db.startSession();

  try {
    await session.withTransaction(async () => {
      booking.$session(session);
      await validateBookingAtomic(booking, session);
    });
  } catch (err) {
    await session.endSession();
    throw err;
  }

  await session.endSession();
});

async function validateBookingUpdate(
  update: any,
  session?: ClientSession
) {
  if (!update) return;

  if (update.$set) {
    if ("email" in update.$set && typeof update.$set.email === "string") {
      if (!isValidEmail(update.$set.email)) {
        throw new Error("Invalid email format");
      }
      update.$set.email = update.$set.email.trim().toLowerCase();
    }

    if ("eventId" in update.$set && update.$set.eventId) {
      const eventQuery = Event.findById(update.$set.eventId);
      if (session) eventQuery.session(session);
      const event = await eventQuery.exec();
      if (!event) {
        throw new Error("Referenced event does not exist");
      }
    }
  } else {
    if ("email" in update && typeof update.email === "string") {
      if (!isValidEmail(update.email)) {
        throw new Error("Invalid email format");
      }
      update.email = update.email.trim().toLowerCase();
    }

    if ("eventId" in update && update.eventId) {
      const eventQuery = Event.findById(update.eventId);
      if (session) eventQuery.session(session);
      const event = await eventQuery.exec();
      if (!event) {
        throw new Error("Referenced event does not exist");
      }
    }
  }
}

BookingSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  const db = this.model.db;
  const session = await db.startSession();

  try {
    await session.withTransaction(async () => {
      this.session(session);
      await validateBookingUpdate(update, session);
    });
  } catch (err) {
    await session.endSession();
    throw err;
  }

  await session.endSession();
});

BookingSchema.pre("updateOne", async function () {
  const update = this.getUpdate();
  const db = this.model.db;
  const session = await db.startSession();

  try {
    await session.withTransaction(async () => {
      this.session(session);
      await validateBookingUpdate(update, session);
    });
  } catch (err) {
    await session.endSession();
    throw err;
  }

  await session.endSession();
});

BookingSchema.pre("updateMany", async function () {
  const update = this.getUpdate();
  const db = this.model.db;
  const session = await db.startSession();

  try {
    await session.withTransaction(async () => {
      this.session(session);
      await validateBookingUpdate(update, session);
    });
  } catch (err) {
    await session.endSession();
    throw err;
  }

  await session.endSession();
});

const Booking = models.Booking || model<IBooking>("Booking", BookingSchema);

export default Booking;
