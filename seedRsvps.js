/**
 * Seed test RSVPs for a given event.
 * Usage: node seedRsvps.js <eventId>
 * Reads MONGO_URI from .env
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { nanoid } from "nanoid";

dotenv.config();

const eventId = process.argv[2];
if (!eventId) {
  console.error("Usage: node seedRsvps.js <eventId>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

// Inline schema so we don't need to import the full app
const rsvpSchema = new mongoose.Schema(
  {
    eventId:          { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    guestName:        { type: String, required: true },
    guestEmail:       { type: String, required: true },
    accessCode:       { type: String, unique: true },
    status:           { type: String, enum: ["ATTENDING", "DECLINED", "WAITLISTED", "PENDING"], default: "PENDING" },
    dietaryNotes:     String,
    additional_notes: String,
    plusOne:          { name: String, dietaryNotes: String },
    waitlistPosition: Number,
    checkedIn:        { type: Boolean, default: false },
    checkedInAt:      Date,
    lastModifiedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const RSVP = mongoose.models.RSVP || mongoose.model("RSVP", rsvpSchema);

const guests = [
  { name: "Alice Johnson",   email: "alice@example.com",   status: "ATTENDING",  checkedIn: true,  dietary: "Vegetarian" },
  { name: "Bob Martinez",    email: "bob@example.com",     status: "ATTENDING",  checkedIn: true,  dietary: "" },
  { name: "Carol White",     email: "carol@example.com",   status: "ATTENDING",  checkedIn: false, dietary: "Gluten-free" },
  { name: "David Chen",      email: "david@example.com",   status: "ATTENDING",  checkedIn: false, dietary: "" },
  { name: "Emma Davis",      email: "emma@example.com",    status: "ATTENDING",  checkedIn: false, dietary: "Vegan" },
  { name: "Frank Wilson",    email: "frank@example.com",   status: "WAITLISTED", checkedIn: false, dietary: "", waitlistPos: 1 },
  { name: "Grace Lee",       email: "grace@example.com",   status: "WAITLISTED", checkedIn: false, dietary: "", waitlistPos: 2 },
  { name: "Henry Brown",     email: "henry@example.com",   status: "DECLINED",   checkedIn: false, dietary: "" },
  { name: "Iris Taylor",     email: "iris@example.com",    status: "PENDING",    checkedIn: false, dietary: "" },
  { name: "Jack Anderson",   email: "jack@example.com",    status: "ATTENDING",  checkedIn: true,  dietary: "Halal",
    plusOne: { name: "Sara Anderson", dietaryNotes: "" } },
];

let created = 0;
let skipped = 0;

for (const g of guests) {
  const exists = await RSVP.findOne({ eventId, guestEmail: g.email });
  if (exists) { skipped++; continue; }

  const doc = {
    eventId,
    guestName:    g.name,
    guestEmail:   g.email,
    accessCode:   nanoid(21),
    status:       g.status,
    dietaryNotes: g.dietary || "",
    checkedIn:    g.checkedIn,
    checkedInAt:  g.checkedIn ? new Date() : null,
    lastModifiedAt: new Date(),
  };
  if (g.waitlistPos) doc.waitlistPosition = g.waitlistPos;
  if (g.plusOne)     doc.plusOne = g.plusOne;

  await RSVP.create(doc);
  created++;
  console.log(`  ✓ ${g.name} (${g.status})`);
}

console.log(`\nDone — ${created} created, ${skipped} already existed.`);
await mongoose.disconnect();
