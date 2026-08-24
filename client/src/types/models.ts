/**
 * Domain types mirroring the server's Mongoose schemas.
 *
 * Hand-written rather than generated: the API surface is small and stable, and
 * a generator would be more machinery than it earns here. If these drift from
 * `server/models/`, the schemas are the source of truth.
 */

/** Must stay in step with MESSAGE_TYPES in server/lib/messageTypes.js */
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "file"
  | "ai-response"
  | "call-event";

/** The types a client is allowed to set when sending. */
export type ClientMessageType = Extract<
  MessageType,
  "text" | "image" | "video" | "file"
>;

export interface User {
  _id: string;
  name: string;
  email: string;
  picture?: string;
}

/** A logged-in user, as stored in localStorage - carries the JWT. */
export interface AuthenticatedUser extends User {
  token: string;
}

export interface Attachment {
  mimeType?: string;
  bytes?: number;
  durationSec?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface Chat {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: User[];
  groupAdmin?: User;
  latestMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  /**
   * Optional on purpose. Messages written before the type field existed read
   * back undefined, because a Mongoose default only applies to new documents.
   * Callers should fall back to inferring from `content`.
   */
  type?: MessageType;
  content: string;
  attachment?: Attachment;
  chat: Chat;
  createdAt: string;
  updatedAt: string;
}

/** Payload for POST /api/message. */
export interface SendMessagePayload {
  content: string;
  chatId: string;
  type?: ClientMessageType;
  attachment?: Attachment;
}
