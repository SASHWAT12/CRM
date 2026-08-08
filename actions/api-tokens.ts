"use server";

export async function getApiTokens() {
  return { data: [] };
}

export async function createApiToken(data: { name: string; expiresAt?: Date }): Promise<{ error?: string; data?: { rawToken: string } | null }> {
  return { error: "API tokens are no longer supported", data: null };
}

export async function deleteApiToken(id: string) {
  return { error: "API tokens are no longer supported" };
}
