export const STELE_STORAGE_REGISTRY = Object.freeze({
  draft: Object.freeze({ key: 'stele-draft', diagnostic: true, nativeType: 'json-string' }),
  preview3d: Object.freeze({ key: 'stele-3d-preview', diagnostic: true, nativeType: 'json-string' }),
  adminToken: Object.freeze({ key: 'stele-order-admin-token', diagnostic: false, nativeType: 'string' }),
  diagnosticErrors: Object.freeze({ key: 'stele-diagnostic-errors-v1', diagnostic: true, nativeType: 'json-string' }),
});

export const STELE_STORAGE_KEYS = Object.freeze(
  Object.fromEntries(Object.entries(STELE_STORAGE_REGISTRY).map(([name, value]) => [name, value.key]))
) as Readonly<Record<keyof typeof STELE_STORAGE_REGISTRY, string>>;

export const STELE_DIAGNOSTIC_STORAGE_KEYS = Object.freeze(
  Object.values(STELE_STORAGE_REGISTRY).filter(item => item.diagnostic).map(item => item.key).sort()
);
