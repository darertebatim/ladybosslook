import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMediaCategories } from "@/hooks/useMediaCategories";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  type: 'audio' | 'video';
}

export const CategorySelect = ({ value, onChange, type }: CategorySelectProps) => {
  const { categories, isLoading } = useMediaCategories(type);

  return (
    <div>
      <Label>Category *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'Loading...' : 'Select category'} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.slug} value={cat.slug}>
              {cat.emoji} {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
