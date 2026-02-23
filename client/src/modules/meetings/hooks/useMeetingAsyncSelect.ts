import { useState } from 'react';

export function useMeetingAsyncSelect(loadOptions: (input: string) => Promise<Array<{ label: string; value: string }>>) {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);

  const fetchOptions = async (input: string) => {
    setLoading(true);
    const opts = await loadOptions(input);
    setOptions(opts);
    setLoading(false);
  };

  return {
    options,
    loading,
    fetchOptions,
  };
}
