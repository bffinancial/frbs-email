import {
  ConfidentialClientApplication,
  type Configuration,
} from "@azure/msal-node";

export const MICROSOFT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "Mail.ReadWrite",
  "Mail.Send",
];

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getMicrosoftConfiguration(): {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  appUrl: string;
} {
  return {
    tenantId: getRequiredEnvironmentVariable("MICROSOFT_TENANT_ID"),
    clientId: getRequiredEnvironmentVariable("MICROSOFT_CLIENT_ID"),
    clientSecret: getRequiredEnvironmentVariable(
      "MICROSOFT_CLIENT_SECRET"
    ),
    redirectUri: getRequiredEnvironmentVariable(
      "MICROSOFT_REDIRECT_URI"
    ),
    appUrl: getRequiredEnvironmentVariable("NEXT_PUBLIC_APP_URL"),
  };
}

export function createMicrosoftClient(
  serializedTokenCache?: string | null
): ConfidentialClientApplication {
  const {
    tenantId,
    clientId,
    clientSecret,
  } = getMicrosoftConfiguration();

  const configuration: Configuration = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  };

  const client = new ConfidentialClientApplication(configuration);

  if (serializedTokenCache) {
    client.getTokenCache().deserialize(serializedTokenCache);
  }

  return client;
}