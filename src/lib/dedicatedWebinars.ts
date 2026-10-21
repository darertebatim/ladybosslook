/** Dedicated-round webinar campaigns sharing the Start Ads landing / thank-you / gift pages. */
export interface DedicatedWebinar {
  slug: string;
  basePath: string;
  regSource: string;
  waitlistSource: string;
  giftSource: string;
  metaEvent: string;
  metaContentName: string;
  liveContentName: string;
  defaultTitle: string;
  hostLine: string;
  icsName: string;
}

export const STARTADS_WEBINAR: DedicatedWebinar = {
  slug: "startads",
  basePath: "/l/startads",
  regSource: "startads_registration",
  waitlistSource: "startads_waitlist",
  giftSource: "igads_gifts",
  metaEvent: "StartAdsLead",
  metaContentName: "StartAds Session 1 Registration",
  liveContentName: "IG Ads Webinar Live",
  defaultTitle: "شروع تبلیغات اینستاگرامی",
  hostLine: "با علی لطفی · موسس Rilo",
  icsName: "startads.ics",
};

export const POWERFREE_WEBINAR: DedicatedWebinar = {
  slug: "powerfree",
  basePath: "/r/powerfree",
  regSource: "powerfree_registration",
  waitlistSource: "powerfree_waitlist",
  giftSource: "powerfree_gifts",
  metaEvent: "PowerFreeLead",
  metaContentName: "PowerFree Webinar Registration",
  liveContentName: "PowerFree Webinar Live",
  defaultTitle: "وبینار رایگان قدرت دو زبانه",
  hostLine: "با راضیه لیدی‌باس",
  icsName: "powerfree.ics",
};
