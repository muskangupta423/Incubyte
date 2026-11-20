/** Response shapes shared by every endpoint. */

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiErrorDetail {
  /** Which field the problem is about, e.g. "pageSize". */
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    details?: ApiErrorDetail[];
  };
}
