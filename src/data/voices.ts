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
export const voices: Voice[] = [
  {
    id: "voice-1",
    title: "Courage Building Session",
    titleFarsi: "جلسه شجاعت‌سازی",
    description: "A powerful session on building inner courage and confidence",
    descriptionFarsi: "جلسه‌ای قدرتمند در مورد ساختن شجاعت و اعتماد به نفس درونی",
    googleDriveId: "1_EXAMPLE_FILE_ID_1", // Replace with actual file IDs
    duration: "15:30",
    category: "mindset"
  },
  {
    id: "voice-2", 
    title: "Leadership Guidance",
    titleFarsi: "راهنمایی رهبری",
    description: "Essential leadership principles for empowered women",
    descriptionFarsi: "اصول ضروری رهبری برای زنان قدرتمند",
    googleDriveId: "2_EXAMPLE_FILE_ID_2", // Replace with actual file IDs
    duration: "22:45",
    category: "leadership"
  },
  {
    id: "voice-3",
    title: "Boundary Setting",
    titleFarsi: "تعیین مرزها",
    description: "How to set healthy boundaries in personal and professional life",
    descriptionFarsi: "چگونه در زندگی شخصی و حرفه‌ای مرزهای سالم تعیین کنیم",
    googleDriveId: "3_EXAMPLE_FILE_ID_3", // Replace with actual file IDs
    duration: "18:20",
    category: "boundaries"
  }
];

// Generate Google Drive streaming URL
export const getGoogleDriveAudioUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

// Voice categories for filtering
export const voiceCategories = [
  { id: "all", label: "All", labelFarsi: "همه" },
  { id: "mindset", label: "Mindset", labelFarsi: "طرز فکر" },
  { id: "leadership", label: "Leadership", labelFarsi: "رهبری" },
  { id: "boundaries", label: "Boundaries", labelFarsi: "مرزها" }
];