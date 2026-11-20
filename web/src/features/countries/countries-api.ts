import type { AddCountryInput, Country } from '@acme/shared';
import { apiRequest } from '../../services/http-client';

export function fetchCountries(signal?: AbortSignal) {
  return apiRequest<Country[]>('/countries', { signal });
}

export function addCountry(input: AddCountryInput) {
  return apiRequest<Country>('/countries', { method: 'POST', body: input });
}
