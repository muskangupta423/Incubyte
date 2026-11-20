import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCountry, fetchCountries } from './countries-api';

const countriesKey = ['countries'] as const;

/** Countries ACME employs people in (set up in the app), A→Z by name. */
export function useCountries() {
  return useQuery({
    queryKey: countriesKey,
    queryFn: ({ signal }) => fetchCountries(signal),
  });
}

export function useAddCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCountry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: countriesKey }),
  });
}
