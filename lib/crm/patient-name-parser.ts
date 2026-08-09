export function parseFullName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = (fullName || "").trim().replace(/\s+/g, " ");
  if (!trimmed) {
    throw new Error("Patient name is required");
  }
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) {
    return { first_name: "", last_name: trimmed };
  }
  return {
    first_name: trimmed.substring(0, spaceIndex),
    last_name: trimmed.substring(spaceIndex + 1),
  };
}

export function formatFullName(first_name?: string | null, last_name?: string | null): string {
  return [first_name, last_name].filter(Boolean).join(" ").trim();
}
