export interface SendMessageResult {
  status: "sent" | "failed";
  providerMessageId: string | null;
  error: string | null;
}
