import { createAccessControl } from "better-auth/plugins/access";

const statements = {
  user: ["create", "read", "update", "delete", "changeRole", "activate", "deactivate"],
  crm: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
} as const;

export const ac = createAccessControl(statements);

export const root = ac.newRole({
  user: ["create", "read", "update", "delete", "changeRole", "activate", "deactivate"],
  crm: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
});

export const admin = ac.newRole({
  user: ["create", "read", "update", "delete", "changeRole", "activate", "deactivate"],
  crm: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
});

export const doctor = ac.newRole({
  user: ["read"],
  crm: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read"],
});

export const receptionist = ac.newRole({
  user: ["read"],
  crm: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read"],
});

export const counsellor = ac.newRole({
  user: ["read"],
  crm: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read"],
});

export const manager = ac.newRole({
  user: ["read"],
  crm: ["create", "read", "update", "delete"],
  project: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read"],
});

export const user = ac.newRole({
  user: ["read"],
  crm: ["read"],
  project: ["read"],
  report: ["read"],
  settings: ["read"],
});
