/**
 * Billing entity configuration
 * DOVECREEK -> syncs to QuickBooks
 * INNOVATIVE -> local only (Supabase only, no QB sync)
 */
export const BILLING_ENTITIES = [
    { id: 'DOVECREEK', name: 'Dovecreek Maquila', syncsToQB: true },
    { id: 'INNOVATIVE', name: 'Innovative Mx', syncsToQB: false },
];

export const billingEntityOptions = [
    { value: 'DOVECREEK', label: 'Dovecreek' },
    { value: 'INNOVATIVE', label: 'Innovative' },
];

/**
 * Check if a billing entity should sync to QuickBooks
 * @param {string} billingEntity - 'DOVECREEK' or 'INNOVATIVE'
 * @returns {boolean}
 */
export const shouldSyncToQB = (billingEntity) => {
    const entity = BILLING_ENTITIES.find(e => e.id === billingEntity);
    return entity?.syncsToQB ?? true;
};
