/**
 * Currency formatting utility for UGX (Ugandan Shillings)
 */

/**
 * Format a number as UGX currency
 * @param {number|string} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showDecimals = true) => {
  const numAmount = parseFloat(amount) || 0
  if (showDecimals) {
    return `UGX ${numAmount.toFixed(2)}`
  }
  return `UGX ${Math.round(numAmount).toLocaleString()}`
}

/**
 * Format currency for input fields (without symbol)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted amount string
 */
export const formatCurrencyInput = (amount) => {
  const numAmount = parseFloat(amount) || 0
  return numAmount.toFixed(2)
}









