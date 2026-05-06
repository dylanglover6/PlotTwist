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
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    permanentLink: {
      type: String,
      trim: true,
      default: ""
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
    }
  },
  {
    timestamps: true
  }
);

export const Invite = mongoose.model("Invite", inviteSchema);
