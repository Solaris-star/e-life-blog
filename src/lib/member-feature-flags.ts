import "server-only";

function isEnabled(name: string) {
  return process.env[name] === "true";
}

export function isDemoAuthEnabled() {
  return isEnabled("ENABLE_MEMBER_DEMO_AUTH");
}

export function isMemberRegistrationEnabled() {
  return isEnabled("ENABLE_MEMBER_REGISTRATION");
}

export function isMemberAdminEnabled() {
  return isEnabled("ENABLE_MEMBER_ADMIN");
}
