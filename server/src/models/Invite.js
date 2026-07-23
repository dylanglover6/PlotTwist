import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    // Unguessable public identifier used in share/reveal URLs (/t/:shareId), so
    // links can't be enumerated the way sequential Mongo ObjectIds can. Set at
    // creation; the raw _id is never exposed by the public API.
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    hostName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    teaserMessage: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    revealTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    // Shown on the second ("More Information") page, not on the reveal itself.
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },
    // Optional event date, stored as plain "YYYY-MM-DD" strings so a calendar
    // day never shifts across timezones. A range uses both start + end.
    eventStartDate: {
      type: String,
      trim: true,
      maxlength: 10,
      default: ""
    },
    eventEndDate: {
      type: String,
      trim: true,
      maxlength: 10,
      default: ""
    },
    eventIsRange: {
      type: Boolean,
      default: false
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ""
    },
    imageAlt: {
      type: String,
      trim: true,
      default: ""
    },
    // Optional Partiful event link. Recipients get an "RSVP on Partiful" button
    // after the reveal. Validated in the invites route (https + partiful host)
    // before it ever reaches here.
    partifulUrl: {
      type: String,
      trim: true,
      maxlength: 400,
      default: ""
    },
    unlockAt: {
      type: Date,
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    wasScheduled: {
      type: Boolean,
      default: false
    },
    creatorIpHash: {
      type: String,
      default: ""
    },

    // ----- Optional creator email notifications (double opt-in) -----
    // These fields are sensitive and are never returned by the public API;
    // see toPublicInvite() in the invites route.
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: ""
    },
    emailConfirmTokenHash: {
      type: String,
      default: ""
    },
    emailConfirmExpiresAt: {
      type: Date,
      default: null
    },
    emailConfirmedAt: {
      type: Date,
      default: null
    },
    // Reusable across confirm/live/expired emails, so stored as a low-sensitivity
    // plaintext token (never exposed by the public API) rather than a hash.
    unsubToken: {
      type: String,
      default: ""
    },
    unsubscribedAt: {
      type: Date,
      default: null
    },
    liveEmailSentAt: {
      type: Date,
      default: null
    },
    expiredEmailSentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Invite = mongoose.model("Invite", inviteSchema);
