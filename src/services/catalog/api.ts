import type { ListParams, PaginationMeta } from '@/types/catalog';
import { api } from 'boot/axios';
import type { AxiosInstance } from 'axios';

export const catalogApi: AxiosInstance = api;

export const mapListParamsToQuery = (params: ListParams = {}) => {
  const query: Record<string, string | number | boolean> = {};

  if (params.search) {
    query.search = params.search;
  }

  if (typeof params.page === 'number') {
    query.page = params.page;
  }

  if (typeof params.perPage === 'number') {
    query.per_page = params.perPage;
  }

  if (params.sort) {
    query.sort = params.sort;
  }

  if (params.order) {
    query.order = params.order;
  }

  if (typeof params.categoryId === 'number') {
    query.category_id = params.categoryId;
  }

  if (typeof params.brandId === 'number') {
    query.brand_id = params.brandId;
  }

  if (params.status) {
    query.status = params.status;
  }

  if (typeof params.isActive === 'boolean') {
    query.is_active = params.isActive ? 1 : 0;
  }

  return query;
};

interface ApiPaginationMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export const mapPaginationMeta = (meta: ApiPaginationMeta): PaginationMeta => ({
  page: meta.page,
  perPage: meta.per_page,
  total: meta.total,
  lastPage: meta.last_page,
});

