import { programs, type Program } from '@/data/programs';

export const usePrograms = () => {
  const getProgramBySlug = (slug: string): Program | undefined => {
    return programs.find(p => p.slug === slug);
  };

  const getProgramByTitle = (title: string): Program | undefined => {
    return programs.find(p => p.title === title);
  };

  const getProgramsByType = (type: Program['type']): Program[] => {
    return programs.filter(p => p.type === type);
  };

  const getFreePrograms = (): Program[] => {
    return programs.filter(p => p.isFree);
  };

  const getPaidPrograms = (): Program[] => {
    return programs.filter(p => !p.isFree);
  };

  const getProgramsByPaymentType = (paymentType: Program['paymentType']): Program[] => {
    return programs.filter(p => p.paymentType === paymentType);
  };

  const getProgramPrice = (slug: string): number => {
    const program = getProgramBySlug(slug);
    return program?.priceAmount || 0;
  };

  const getAllProgramTitles = (): string[] => {
    return programs.map(p => p.title);
  };

  const getAllProgramSlugs = (): string[] => {
    return programs.map(p => p.slug);
  };

  return {
    programs,
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
