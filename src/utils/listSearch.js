/**
 * Reusable case-insensitive partial-name list filter.
 * @param {Array<{ name?: string, [key: string]: unknown }>} items
 * @param {string} query
 * @param {(item: unknown) => string} [getLabel]
 * @returns {typeof items}
 */
export function filterItemsByNameSearch(items, query, getLabel = (item) => item?.name ?? "") {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    String(getLabel(item) ?? "")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}
