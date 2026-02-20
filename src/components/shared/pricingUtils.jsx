/**
 * Get the price for a specific lead based on the client's industry pricing config.
 * Falls back to the client's default price if no industry match found.
 * 
 * @param {object} client - The client entity
 * @param {object} lead - The lead entity (needs `industries` array)
 * @returns {number} The price per unit for this lead
 */
export function getLeadPrice(client, lead) {
  const bt = client.billing_type || 'pay_per_show';
  if (bt === 'retainer') return 0;

  const industryPricing = client.industry_pricing || {};
  const defaultPrice = bt === 'pay_per_set'
    ? (client.price_per_set_appointment || 0)
    : (client.price_per_shown_appointment || 0);

  // Lead industries - use the first (and ideally only) industry
  const leadIndustries = lead.industries || [];
  if (leadIndustries.length > 0 && Object.keys(industryPricing).length > 0) {
    const leadIndustry = leadIndustries[0];
    if (leadIndustry in industryPricing && industryPricing[leadIndustry] > 0) {
      return industryPricing[leadIndustry];
    }
  }

  return defaultPrice;
}

/**
 * Compute total revenue for a set of leads for a given client.
 * Handles industry-specific pricing automatically.
 * 
 * @param {object} client - The client entity
 * @param {array} qualifiedLeads - Array of leads that qualify for billing
 * @returns {number} Total revenue
 */
export function computeLeadRevenue(client, qualifiedLeads) {
  return qualifiedLeads.reduce((sum, lead) => sum + getLeadPrice(client, lead), 0);
}