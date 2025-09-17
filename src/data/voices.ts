export interface Voice {
  id: string;
  title: string;
  titleFarsi: string;
  description: string;
  descriptionFarsi: string;
  googleDriveId: string;
  duration?: string;
  category?: string;
}

// Voice recordings metadata from Google Drive folder
// Note: Replace these with actual file IDs from your folder once available
export const voices: Voice[] = [
  {
    id: "voice-1",
    title: "Empowered Ladyboss Coaching",
    titleFarsi: "کوچینگ لیدی باس قدرتمند",
    description: "A powerful coaching session for empowered women leaders",
    descriptionFarsi: "جلسه کوچینگ قدرتمند برای زنان رهبر قدرتمند",
    googleDriveId: "101BvMtA5ZhpNx8i2DKGe4SyAs06EGD5T",
    duration: "Loading...",
    category: "coaching"
  }
];

// Generate Google Drive streaming URL for individual files
// This format works for publicly shared files
export const getGoogleDriveAudioUrl = (fileId: string): string => {
  // Use the direct download format for shared files
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

// Voice categories for filtering
export const voiceCategories = [
  { id: "all", label: "All", labelFarsi: "همه" },
  { id: "mindset", label: "Mindset", labelFarsi: "طرز فکر" },
  { id: "leadership", label: "Leadership", labelFarsi: "رهبری" },
  { id: "boundaries", label: "Boundaries", labelFarsi: "مرزها" }
];