const mongoose = require("mongoose");
const { ALL_MESSAGE_TYPES, MESSAGE_TYPES } = require("../lib/messageTypes");

const MAX_MESSAGE_LENGTH = 4000;

/**
 * Metadata about an attached file.
 *
 * Optional and free of required fields: the URL in `content` is the load-bearing
 * part, and this is what lets the client render well without a round trip -
 * a poster frame and dimensions mean video and images can reserve their layout
 * space instead of reflowing the message list when they load.
 */
const attachmentSchema = mongoose.Schema(
  {
    mimeType: { type: String, trim: true },
    bytes: { type: Number, min: 0 },
    durationSec: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    thumbnailUrl: { type: String, trim: true },
  },
  { _id: false }
);

const messageModel = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    //What kind of message this is, so the client renders it by type rather than
    //sniffing the content string. Documents written before this field existed
    //read back as undefined - a schema default only applies to new documents -
    //so the client falls back to inferTypeFromContent for those.
    type: {
      type: String,
      enum: ALL_MESSAGE_TYPES,
      default: MESSAGE_TYPES.TEXT,
    },
    content: {
      type: String,
      //A call-event ("Alice started a call") has no natural body, so content is
      //required for everything except that.
      required: function () {
        return this.type !== MESSAGE_TYPES.CALL_EVENT;
      },
      trim: true,
      maxlength: MAX_MESSAGE_LENGTH,
    },
    attachment: {
      type: attachmentSchema,
      default: undefined,
    },
    //Indexed: this is the sole filter of the app's highest-volume query
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageModel);

module.exports = Message;
