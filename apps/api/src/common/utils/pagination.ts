export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export function getPagination(query: PaginationQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return {
    items,
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 1,
    },
  };
}
