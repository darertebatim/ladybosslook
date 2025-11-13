import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Program, programImages } from '@/data/programs';
import { isNativeApp } from '@/lib/platform';

export const usePrograms = () => {
  const isNative = isNativeApp();
  
  // Fetch programs from database
  const { data: dbPrograms = [], isLoading, error } = useQuery({
    queryKey: ['programs', isNative ? 'mobile' : 'web'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('*')
        .eq('is_active', true)
        .eq(isNative ? 'available_on_mobile' : 'available_on_web', true)
        .order('slug');
      
      if (error) throw error;
      
      // Map database records to Program type with images
      return (data || []).map(dbProgram => ({
        title: dbProgram.title,
        slug: dbProgram.slug,
        description: dbProgram.description || '',
        image: programImages[dbProgram.slug] || programImages['default'],
        duration: dbProgram.duration || 'Self-paced',
        participants: '0', // Not stored in DB
        rating: 4.9, // Not stored in DB
        features: Array.isArray(dbProgram.features) ? dbProgram.features : [],
        price: `$${(dbProgram.price_amount / 100).toFixed(0)}`,
        priceAmount: dbProgram.price_amount / 100,
        originalPrice: dbProgram.original_price ? `$${(dbProgram.original_price / 100).toFixed(0)}` : undefined,
        limitedSpots: undefined,
        popular: false, // Not stored in DB
        link: `/${dbProgram.slug}`,
        type: dbProgram.type as Program['type'],
        paymentType: dbProgram.payment_type as Program['paymentType'],
        isFree: dbProgram.payment_type === 'free',
        subscriptionDuration: dbProgram.subscription_duration || undefined,
        subscriptionFullPaymentDiscount: dbProgram.subscription_full_payment_discount || undefined,
        deliveryMethod: dbProgram.delivery_method || undefined,
      })) as Program[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const getProgramBySlug = (slug: string): Program | undefined => {
    return dbPrograms.find(p => p.slug === slug);
  };

  const getProgramByTitle = (title: string): Program | undefined => {
    return dbPrograms.find(p => p.title === title);
  };

  const getProgramsByType = (type: Program['type']): Program[] => {
    return dbPrograms.filter(p => p.type === type);
  };

  const getFreePrograms = (): Program[] => {
    return dbPrograms.filter(p => p.isFree);
  };

  const getPaidPrograms = (): Program[] => {
    return dbPrograms.filter(p => !p.isFree);
  };

  const getProgramsByPaymentType = (paymentType: Program['paymentType']): Program[] => {
    return dbPrograms.filter(p => p.paymentType === paymentType);
  };

  const getProgramPrice = (slug: string): number => {
    const program = getProgramBySlug(slug);
    return program?.priceAmount || 0;
  };

  const getAllProgramTitles = (): string[] => {
    return dbPrograms.map(p => p.title);
  };

  const getAllProgramSlugs = (): string[] => {
    return dbPrograms.map(p => p.slug);
  };

  return {
    programs: dbPrograms,
    isLoading,
    error,
    getProgramBySlug,
    getProgramByTitle,
    getProgramsByType,
    getFreePrograms,
    getPaidPrograms,
    getProgramsByPaymentType,
    getProgramPrice,
    getAllProgramTitles,
    getAllProgramSlugs,
  };
};
