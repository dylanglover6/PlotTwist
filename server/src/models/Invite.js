import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
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
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
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
    moreInfoEnabled: {
      type: Boolean,
      default: false
    },
    moreInfoTitle: {
      type: String,
      trim: true,
      maxlength: 140,
      default: ""
    },
    moreInfoDescription: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: ""
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
