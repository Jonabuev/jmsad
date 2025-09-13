import useSWR from 'swr';
import { useRouter } from 'next/router';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  user_type: string;
  order: number;
}

const fetcher = async (url: string): Promise<FAQ[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch FAQ');
  }
  return response.json();
};

export const useFAQ = (userType: 'tenants' | 'landlords' | 'both' = 'both') => {
  const { locale } = useRouter();
  
  const { data, error, isLoading, mutate } = useSWR(
    `http://localhost:8000/api/faq/?user_type=${userType}&locale=${locale || 'ru'}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Не обновляем автоматически
    }
  );

  return {
    faqs: data || [],
    isLoading,
    error,
    mutate,
  };
};

export const useComplaintReasons = (type?: 'tenant' | 'landlord') => {
  const { locale } = useRouter();
  
  const url = type 
    ? `http://localhost:8000/api/complaint-reasons/?type=${type}&locale=${locale || 'ru'}`
    : `http://localhost:8000/api/complaint-reasons/?locale=${locale || 'ru'}`;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
    }
  );

  return {
    reasons: data || [],
    isLoading,
    error,
    mutate,
  };
};
