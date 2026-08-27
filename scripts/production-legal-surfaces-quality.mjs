import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const privacy = read("app", "privacy-policy", "page.tsx");
const terms = read("app", "terms", "page.tsx");
const home = read("app", "page.tsx");
const register = read("app", "register", "page.tsx");
const authSession = read("lib", "auth", "session.ts");
const savedContracts = read("lib", "saved-decision-simulations", "contracts.ts");
const savedSurface = read("lib", "saved-decision-simulations", "product-surface.ts");
const exportSurface = read("lib", "user-data-controls", "account-data-export-surface.ts");
const draftPersistence = read("lib", "persistence-runtime", "simulation-draft-persistence.ts");
const draftRetention = read("lib", "user-data-controls", "simulation-draft-retention-enforcement.ts");
const draftDeletion = read("lib", "user-data-controls", "simulation-draft-deletion-execution.ts");
const releaseEnvironment = read("scripts", "deterministic-release-validation-environment.mjs");
const normalizedPrivacy = privacy.replace(/\s+/g, " ");
const normalizedTerms = terms.replace(/\s+/g, " ");

const checks = [];
function check(name, condition, detail) {
  checks.push({ name, passed: Boolean(condition), detail });
}

const legalCopy = `${privacy}\n${terms}`;

check("privacy-account-auth-fact", privacy.includes("Supabase Auth") && privacy.includes("sin contraseña"));
check("privacy-no-stale-future-auth-claim", !privacy.includes("cuando el sistema de acceso esté configurado"));
check("privacy-persistence-fact", privacy.includes("simulaciones activas y archivadas") && privacy.includes("borradores") && privacy.includes("historial"));
check("privacy-no-stale-local-only-claim", !privacy.includes("se almacenan localmente en este navegador"));
check("privacy-owner-scope-fact", privacy.includes("cuenta autenticada que es propietaria"));
check("privacy-full-export-fact", normalizedPrivacy.includes("contenido completo elegible de entradas y resultados guardados") && normalizedPrivacy.includes("activos como archivados"));
check("privacy-export-exclusions-fact", privacy.includes("datos eliminados") && privacy.includes("detalles técnicos internos"));
check("privacy-individual-deletion-fact", privacy.includes("eliminar individualmente simulaciones guardadas y borradores"));
check("privacy-no-account-deletion-overclaim", normalizedPrivacy.includes("no ofrece un control autoservicio para eliminar la cuenta completa"));
check("privacy-retention-fact", privacy.includes("30 días") && privacy.includes("7 días anteriores"));
check("privacy-provider-off-fact", privacy.includes("proveedor de IA no está activado") && privacy.includes("no se envían a un proveedor de IA"));
check("privacy-external-legal-handoff", privacy.includes("requieren confirmación del titular y revisión jurídica externa"));

check("terms-decision-support-fact", terms.includes("herramienta de apoyo") && terms.includes("resultados son orientativos"));
check("terms-no-professional-advice-promise", terms.includes("no constituyen asesoramiento legal, financiero o médico"));
check("terms-account-capability-fact", terms.includes("crear una cuenta") && terms.includes("sin contraseña"));
check("terms-saved-data-capability-fact", terms.includes("guardar, consultar, reabrir, archivar, exportar y eliminar individualmente"));
check("terms-responsible-use", terms.includes("No utilices Levio para causar daño, cometer fraude"));
check("terms-availability-boundary", terms.includes("puede no estar disponible de forma ininterrumpida"));
check("terms-provider-off-fact", terms.includes("proveedor de IA no está activado"));
check("terms-no-billing-obligations", !/(?:suscripci[oó]n|plan de pago|facturaci[oó]n|cuota|precio)/i.test(terms));
check("terms-external-legal-handoff", terms.includes("requieren confirmación del titular") && terms.includes("revisión jurídica externa"));

check("implementation-auth-evidence", register.includes("signInWithOtp") && register.includes("shouldCreateUser: true") && authSession.includes("getSession()") && authSession.includes("getUser()"));
check("implementation-persistence-evidence", savedContracts.includes("ownerScopedReadsOnly: true") && savedContracts.includes("ownerScopedWritesOnly: true") && savedSurface.includes("deleteSavedSimulationSurface"));
check("implementation-export-evidence", exportSurface.includes('state: "saved" | "archived"') && exportSurface.includes("INTERNAL_CONTENT_KEYS") && exportSurface.includes("sanitizeAccountExportDerivedContent"));
check("implementation-deletion-evidence", draftDeletion.includes("deleteOwnedSimulationDraft") && draftDeletion.includes('export_eligible !== false'));
check("implementation-retention-evidence", draftPersistence.includes("SIMULATION_DRAFT_RETENTION_DAYS = 30") && draftRetention.includes("SIMULATION_DRAFT_WARNING_DAYS = 7"));
check("implementation-provider-off-evidence", releaseEnvironment.includes('LEVIO_REAL_AI_DEV_ENABLED = "false"') && releaseEnvironment.includes('delete environment[key]'));

check("navigation-home-legal-links", home.includes('{ label: "Privacidad", href: "/privacy-policy" }') && home.includes('{ label: "Términos", href: "/terms" }'));
check("navigation-registration-legal-links", register.includes('<Link href="/privacy-policy">') && register.includes('<Link href="/terms">'));
check("navigation-cross-links", privacy.includes('<Link href="/terms">') && terms.includes('<Link href="/privacy-policy">'));
check("legal-shared-accessible-shell", privacy.includes("<PublicSecondaryShell") && terms.includes("<PublicSecondaryShell") && privacy.includes('variant="legal"') && terms.includes('variant="legal"'));

for (const marker of ["stage-7", "mock_recommendation_available", "STAGE9_QUALIFIED", "internal substep", "debug substep"]) {
  check(`legal-copy-excludes-${marker}`, !legalCopy.includes(marker));
}
check("legal-copy-makes-no-approval-claim", !/(?:legally approved|lawyer approved|GDPR compliant|fully compliant|este (?:documento|texto) (?:está|ha sido) jurídicamente aprobado)/i.test(legalCopy));
check("legal-surfaces-are-not-labelled-provisional", !/(?:Privacidad provisional|Términos provisionales|Política de privacidad provisional|Términos de uso provisionales)/i.test(`${normalizedPrivacy}\n${normalizedTerms}`));

const failed = checks.filter((item) => !item.passed);
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);
}
console.log(`\nProduction legal surfaces quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
