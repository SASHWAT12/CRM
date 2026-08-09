// Single authoritative transition matrix definition for Patient Conversion Pipeline
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "CONSULTATION_BOOKED", "CLOSED_LOST"],
  CONTACTED: ["INTERESTED", "CONSULTATION_BOOKED", "CLOSED_LOST"],
  INTERESTED: ["CONSULTATION_BOOKED", "CLOSED_LOST"],
  CONSULTATION_BOOKED: ["VISITED", "CLOSED_LOST"],
  VISITED: ["TREATMENT_STARTED", "CLOSED_LOST"],
  TREATMENT_STARTED: ["CONVERTED", "CLOSED_LOST"],
  CONVERTED: [], // Terminal success
  CLOSED_LOST: ["NEW"], // Recovery scenario
};

export function getAllowedNextStages(currentStage: string): string[] {
  return ALLOWED_TRANSITIONS[currentStage] || [];
}
