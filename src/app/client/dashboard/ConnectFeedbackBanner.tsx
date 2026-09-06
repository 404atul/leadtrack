const ERROR_MESSAGES: Record<string, string> = {
  denied: "connection was cancelled.",
  invalid_request: "Something went wrong starting the connection. Please try again.",
  invalid_state: "That connection link expired. Please try connecting again.",
  session_mismatch: "Please log in as this client before connecting.",
  no_pages_or_accounts: "No Facebook Pages or ad accounts were found on that account.",
  no_accounts: "No Google Ads accounts were found on that account.",
  connect_failed: "Couldn't complete the connection. Please try again.",
};

export default function ConnectFeedbackBanner({
  platform,
  connected,
  error,
}: {
  platform: string;
  connected: boolean;
  error: string | null;
}) {
  if (connected) {
    return (
      <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-inset ring-green-600/20">
        {platform} account connected successfully.
      </div>
    );
  }

  if (error) {
    const message = ERROR_MESSAGES[error] ?? "Something went wrong connecting.";
    return (
      <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
        {error === "denied" ? `${platform} ${message}` : `${platform}: ${message}`}
      </div>
    );
  }

  return null;
}
