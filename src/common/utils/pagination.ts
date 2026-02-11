import { FilterQuery, Model, SortOrder } from 'mongoose';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: SortOrder;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  meta: PaginationMeta;
  data: T[];
}

const toPositiveInt = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  const rounded = Math.floor(numeric);
  if (rounded <= 0) {
    return fallback;
  }

  return rounded;
};

export const parsePagination = (query: Record<string, unknown>): PaginationOptions => {
  const page = toPositiveInt(query.page, DEFAULT_PAGE);
  const rawLimit = toPositiveInt(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(rawLimit, MAX_LIMIT);

  const sortBy = typeof query.sortBy === 'string' && query.sortBy.trim() ? query.sortBy.trim() : 'createdAt';
  const rawSortOrder = typeof query.sortOrder === 'string' ? query.sortOrder.toLowerCase() : 'desc';
  const sortOrder: SortOrder = rawSortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    sortOrder
  };
};

export const buildPaginationMeta = (
  total: number,
  options: Pick<PaginationOptions, 'page' | 'limit'>
): PaginationMeta => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / options.limit);

  return {
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPrevPage: options.page > 1 && totalPages > 0
  };
};

interface PaginateModelConfig {
  sort?: Record<string, SortOrder>;
}

export const paginateModel = async <TDoc>(
  model: Model<TDoc>,
  filter: FilterQuery<TDoc>,
  options: PaginationOptions,
  config?: PaginateModelConfig
): Promise<PaginatedResult<TDoc>> => {
  const sort = config?.sort || { [options.sortBy]: options.sortOrder };

  const [data, total] = await Promise.all([
    model
      .find(filter)
      .sort(sort)
      .skip(options.skip)
      .limit(options.limit),
    model.countDocuments(filter)
  ]);

  return {
    meta: buildPaginationMeta(total, options),
    data
  };
};
