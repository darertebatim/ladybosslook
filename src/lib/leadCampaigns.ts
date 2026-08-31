export interface LeadCampaign {
  key: string;
  label: string;
  labelFa?: string;
  programSlug: string;
  landingPath: string;
  thankYouPath: string;
  /** form_submissions.source used for the main registration */
  regSource: string;
  /** optional secondary sources (interest, recovery email, etc.) */
  extraSources: string[];
  /** Meta pixel custom event fired on signup */
  metaEvent: string;
  /** Edge function that sends the confirmation email */
  confirmationFunction?: string;
  emailOnly?: boolean;
}

export const LEAD_CAMPAIGNS: LeadCampaign[] = [
  {
    key: 'sixtraps',
    label: '6 Instagram Traps',
    labelFa: 'وبینار ۶ تله اینستاگرام',
    programSlug: 'instagram6traps',
    landingPath: '/sixtraps',
    thankYouPath: '/thankyousixtraps',
    regSource: 'sixtraps_registration',
    extraSources: ['presixtraps_interest', 'sixtraps_additional_email'],
    metaEvent: 'SixTrapsLead',
    confirmationFunction: 'send-sixtraps-confirmation',
  },
  {
    key: 'smartinsta',
    label: 'Smart Instagram Framework',
    labelFa: 'فریم‌ورک هوشمند اینستاگرام',
    programSlug: 'smartinstagramframework',
    landingPath: '/smartinstaframework',
    thankYouPath: '/thankyousmartinstaframework',
    regSource: 'smartinsta_registration',
    extraSources: ['smartinsta_additional_email'],
    metaEvent: 'SmartInstaLead',
    confirmationFunction: 'send-sixtraps-confirmation',
    emailOnly: true,
  },
  {
    key: 'igads',
    label: 'Instagram Ads',
    labelFa: 'وبینار جذب مشتری با اینستاگرام ادز',
    programSlug: 'instagramads',
    landingPath: '/l/igadsfree',
    thankYouPath: '/l/igadsfree/thankyou',
    regSource: 'igads_registration',
    extraSources: ['preigads_interest', 'igads_additional_email'],
    metaEvent: 'IGAdsFreeLead',
    confirmationFunction: 'send-sixtraps-confirmation',
  },
];

export const ALL_LEAD_SOURCES = LEAD_CAMPAIGNS.flatMap((c) => [c.regSource, ...c.extraSources]);

export function campaignBySource(source: string | null): LeadCampaign | undefined {
  if (!source) return undefined;
  return LEAD_CAMPAIGNS.find((c) => c.regSource === source || c.extraSources.includes(source));
}
