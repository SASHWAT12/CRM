/**
 * Centralized business policy configuration for CRM operational workbenches.
 * Defines time thresholds, active stage buckets, and operational query rules.
 */

export const CRM_POLICY = {
  // General thresholds in milliseconds
  THRESHOLDS: {
    STALE_PATIENT_MS: 14 * 24 * 60 * 60 * 1000,          // 14 days of inactivity
    RECENT_CONVERSION_MS: 7 * 24 * 60 * 60 * 1000,       // 7 days since converted
    NEW_LEAD_MS: 24 * 60 * 60 * 1000,                    // 24 hours for new lead status
    UNTOUCHED_LEAD_MS: 3 * 24 * 60 * 60 * 1000,          // 3 days of no activity on leads
    AT_RISK_LEAD_MS: 14 * 24 * 60 * 60 * 1000,           // 14 days in pipeline without conversion
    APPOINTMENT_STARTING_SOON_MS: 2 * 60 * 60 * 1000,    // 2 hours lead time
  },

  // Stage and status definitions
  STAGES: {
    ACTIVE_PATIENT_PIPELINE: ["NEW", "CONTACTED", "INTERESTED", "CONSULTATION_BOOKED", "VISITED"],
    CONVERTED_STAGE: "TREATMENT_STARTED",
    CLOSED_LOST_STAGE: "CLOSED_LOST",
    HOT_LEAD_STATUSES: ["Hot", "Priority", "In Progress"],
  },
};
