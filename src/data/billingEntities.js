/**
 * Billing Entities — single source of truth
 *
 * Used across modules (Quotations, Clients, etc.) so every place that needs
 * the legal billing company list reads from here instead of redefining it.
 *
 * id is what gets persisted in the DB column `billing_entity` (varchar).
 * syncsToQB drives the QuickBooks pipeline (only Dovecreek syncs today).
 *
 * The extra fields (legalName, address, phone, email, rfc, defaultTaxRate,
 * country) drive the per-entity quotation PDF branding — logo, "From" block
 * and tax behaviour all switch based on the selected entity. The logo images
 * themselves live in src/assets/entities and are wired up in utils/pdfExport.js
 * (keyed by id) so this data file stays free of asset imports.
 */

export const BILLING_ENTITIES = [
  {
    id: "DOVECREEK",
    name: "Dovecreek",
    legalName: "Dovecreek Wood Products, Inc",
    tagline: "Lifetime Masterpieces",
    country: "US",
    syncsToQB: true,
    // "From" block on the quotation PDF
    rfc: null,
    address: ["3519 Main St Suite 402", "Chula Vista, CA 91911"],
    phone: "(619) 671-0170",
    email: "sales@dovecreekproducts.com",
    // USA entity: 16% IVA does NOT apply. Tax depends on the US delivery state,
    // so the rate is left at 0 by default and is editable per quotation.
    defaultTaxRate: 0,
  },
  {
    id: "INNOVATIVE",
    name: "Innovative Millwork",
    legalName: "Innovative Millwork",
    tagline: "Innovative designs, exceptional quality",
    country: "MX",
    syncsToQB: false,
    rfc: "TPS221102T94",
    address: [
      "Camino Vecinal 21801-A",
      "Col. Murua Oriente CP 22465",
      "Tijuana, B.C.",
    ],
    phone: "(663) 119-0393",
    email: "Avaladez@innovativemillwkmex.com",
    // Mexican entity: standard 16% IVA.
    defaultTaxRate: 0.16,
  },
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

/**
 * Default tax rate (as a fraction, e.g. 0.16) for an entity. Mexican entities
 * carry 16% IVA; the USA entity defaults to 0 because the rate depends on the
 * delivery state and is set per quotation. Unknown ids fall back to 16%.
 * @param {string} billingEntity
 * @returns {number}
 */
export const getDefaultTaxRate = (billingEntity) => {
  const entity = getBillingEntity(normalizeBillingEntity(billingEntity));
  return entity?.defaultTaxRate ?? 0.16;
};
