export * from '@chainlink/optimism-utils'

// TODO: Fix ERROR { "reason":"cannot estimate gas; transaction may fail or may require manual gas limit","code":"UNPREDICTABLE_GAS_LIMIT" }
export const TX_OVERRIDES_BUG: any = {
  gasLimit: 8_999_999,
}
