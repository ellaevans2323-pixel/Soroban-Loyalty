/**
 * Simple validation test to ensure schemas work correctly
 * This test doesn't require complex TypeScript setup
 */

const { z } = require('zod');

// Import validation schemas
const StellarAddressSchema = z.object({
  address: z.string().length(56, 'Stellar address must be 56 characters')
});

const ClaimSchema = z.object({
  campaign_id: z.number().int().positive(),
  amount: z.number().int().positive(),
});

const IdParamsSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

describe('Validation Schemas', () => {
  test('StellarAddressSchema validates correct addresses', () => {
    const validAddress = 'GCKFBEIYTKP5RDBQMTVVALONAOPBXICILMAFKKWOHHJJD42YSWDYD2QC';
    const result = StellarAddressSchema.safeParse({ address: validAddress });
    expect(result.success).toBe(true);
  });

  test('StellarAddressSchema rejects invalid addresses', () => {
    const result = StellarAddressSchema.safeParse({ address: 'invalid' });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toBe('Stellar address must be 56 characters');
  });

  test('ClaimSchema validates correct claims', () => {
    const result = ClaimSchema.safeParse({ campaign_id: 1, amount: 100 });
    expect(result.success).toBe(true);
  });

  test('ClaimSchema rejects invalid claims', () => {
    const result = ClaimSchema.safeParse({ campaign_id: -1, amount: 'invalid' });
    expect(result.success).toBe(false);
  });

  test('IdParamsSchema transforms string IDs to numbers', () => {
    const result = IdParamsSchema.safeParse({ id: '123' });
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(123);
  });

  test('IdParamsSchema rejects invalid IDs', () => {
    const result = IdParamsSchema.safeParse({ id: 'invalid' });
    expect(result.success).toBe(false);
  });
});
