export function isIndividualWorkspace(
  agency?: { workspace_mode?: string | null; plan?: string | null } | null,
) {
  return agency?.workspace_mode === "creator" || agency?.plan === "creator";
}

export function pickIndividualBrand<T extends { id: string; is_active?: boolean | null }>(
  clients: T[] | null | undefined,
): T | null {
  const rows = clients || [];
  return rows.find((row) => row.is_active !== false) || rows[0] || null;
}

export function individualBrandHref(clientId: string, tab = "competitors") {
  return `/clients/${clientId}?tab=${tab}`;
}
