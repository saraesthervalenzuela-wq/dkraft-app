/**
 * Billing Entities — single source of truth
 *
 * Used across modules (Quotations, Clients, etc.) so every place that needs
 * the legal billing company list reads from here instead of redefining it.
 *
 * id is what gets persisted in the DB column `billing_entity` (varchar).
 * syncsToQB drives the QuickBooks pipeline (only Dovecreek syncs today).
 */

export const BILLING_ENTITIES = [
  { id: "DOVECREEK", name: "Dovecreek Maquila", syncsToQB: true },
  { id: "INNOVATIVE", name: "Innovative Mx", syncsToQB: false },
];

export const DEFAULT_BILLING_ENTITY = "DOVECREEK";

/**
 * Look up a billing entity by id. Returns null when not found.
 * @param {string} id
 */
export const getBillingEntity = (id) =>
  BILLING_ENTITIES.find((e) => e.id === id) || null;

/**
 * Normalize a raw billing_entity value coming from the API / cache / fallback.
 * Anything unknown (null, empty, unexpected) collapses to the default so the
 * UI never blanks out a client.
 * @param {*} value
 */
export const normalizeBillingEntity = (value) => {
  if (!value) return DEFAULT_BILLING_ENTITY;
  const upper = String(value).toUpperCase();
  return BILLING_ENTITIES.some((e) => e.id === upper)
    ? upper
    : DEFAULT_BILLING_ENTITY;
};

/**
 * Options ({ value, label }) for billing-entity <select> inputs.
 */
export const billingEntityOptions = BILLING_ENTITIES.map((e) => ({
  value: e.id,
  label: e.name,
}));

/**
 * Whether a billing entity should sync to QuickBooks.
 * Drives the conditional QB pipeline (today only Dovecreek syncs).
 * Unknown values default to true (fail-safe toward syncing).
 * @param {string} billingEntity
 * @returns {boolean}
 */
export const shouldSyncToQB = (billingEntity) => {
  const entity = BILLING_ENTITIES.find((e) => e.id === billingEntity);
  return entity?.syncsToQB ?? true;
};
