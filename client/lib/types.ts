/** Shapes shared with the API. See docs/DESIGN.md §6. */

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FieldError {
  field: string;
  message: string;
}
