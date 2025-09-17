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
    title: "Courage Building Session",
    titleFarsi: "جلسه شجاعت‌سازی",
    description: "A powerful session on building inner courage and confidence",
    descriptionFarsi: "جلسه‌ای قدرتمند در مورد ساختن شجاعت و اعتماد به نفس درونی",
    googleDriveId: "xq0LH0I40qS16NCEzNm0xJS7C38OcUBX",
    duration: "15:30",
    category: "mindset"
  },
  {
    id: "voice-2", 
    title: "Leadership Guidance",
    titleFarsi: "راهنمایی رهبری",
    description: "Essential leadership principles for empowered women",
    descriptionFarsi: "اصول ضروری رهبری برای زنان قدرتمند",
    googleDriveId: "1xq0LH0I40qS16NCEzNm0xJS7C38OcUBX", // Placeholder - needs actual file ID
    duration: "22:45",
    category: "leadership"
  },
  {
    id: "voice-3",
    title: "Boundary Setting",
    titleFarsi: "تعیین مرزها",
    description: "How to set healthy boundaries in personal and professional life",
    descriptionFarsi: "چگونه در زندگی شخصی و حرفه‌ای مرزهای سالم تعیین کنیم",
    googleDriveId: "1xq0LH0I40qS16NCEzNm0xJS7C38OcUBX", // Placeholder - needs actual file ID
    duration: "18:20",
    category: "boundaries"
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