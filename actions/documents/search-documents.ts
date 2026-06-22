"use server";

export interface DocumentSearchResult {
  id: string;
  name: string;
  summary: string | null;
}

export async function searchDocuments(query: string): Promise<DocumentSearchResult[]> {
  return [];
}
