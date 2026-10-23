import { Schema, model, models, Document, Types } from "mongoose";
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

// Index for faster queries by event
BookingSchema.index({ eventId: 1 });

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

BookingSchema.pre("save", async function () {
  const booking = this as IBooking;

  // Validate email format
  if (!isValidEmail(booking.email)) {
    throw new Error("Invalid email format");
  }

  // Verify referenced event exists
  if (booking.isModified("eventId")) {
    const eventExists = await Event.exists({ _id: booking.eventId });
    if (!eventExists) {
      throw new Error("Referenced event does not exist");
    }
  }
});

const Booking = models.Booking || model<IBooking>("Booking", BookingSchema);

export default Booking;
