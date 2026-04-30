export type EventRecord = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
};

export type AttendeeVisibility = "hidden" | "public" | "connections_only";

export type AttendeeRecord = {
  id: string;
  eventId: string;
  displayName: string;
  email?: string;
  visibility: AttendeeVisibility;
  createdAt: string;
};

export type ConnectionProvider = "upload" | "linkedin" | "none";

export type IdentityLinkRecord = {
  attendeeId: string;
  provider: ConnectionProvider;
  providerUserId?: string;
  createdAt: string;
};

