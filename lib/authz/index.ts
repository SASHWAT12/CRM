export type { AppRole } from "./roles";
export { APP_ROLES, parseRole, mapLegacyRole } from "./roles";
export { AuthenticationError, AuthorizationError } from "./errors";
export {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundOrForbiddenResponse,
} from "./route";
export type { AuthzUser } from "./session";
export {
  requireAuthenticated,
  requireRole,
  isAdmin,
  isManagerOrAdmin,
} from "./session";
export {
  tryScopedUpdateContact,
} from "./scopes/crm";
export {
  assertCanReadContact,
  assertCanWriteContact,
} from "./scopes/crm";
export {
  filterAuthorizedContactIds,
  filterAuthorizedLeadIds,
} from "./scopes/crm";
export {
  leadReadScopeWhere,
  contactReadScopeWhere,
  assertCanReadLead,
} from "./scopes/crm";
export { assertCanReadActivityForEntity } from "./scopes/crm";
export {
  assertCanReadTask,
  assertCanWriteTask,
} from "./scopes/crm";
export type { ReportScope } from "./scopes/report-scope";
export { getReportScope } from "./scopes/report-scope";
