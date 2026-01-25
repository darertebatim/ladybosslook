import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface TimeWheelPickerProps {
  value: string; // "HH:mm" format
  onChange: (value: string) => void;
}

// Generate arrays for picker
const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 12 hours: 12, 1, 2, ... 11
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0-59
const PERIODS = ['AM', 'PM'] as const;

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

// Number of times to repeat the array for infinite scroll effect
const REPEAT_COUNT = 5;

interface WheelColumnProps {
  items: (string | number)[];
  selectedValue: number | string;
  onSelect: (value: number | string) => void;
  formatItem?: (item: string | number) => string;
  isInfinite?: boolean;
}

const WheelColumn = ({ items, selectedValue, onSelect, formatItem, isInfinite = false }: WheelColumnProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [lastSelectedValue, setLastSelectedValue] = useState(selectedValue);

  // For infinite scroll, create repeated items
  const displayItems = isInfinite
    ? Array.from({ length: REPEAT_COUNT }, () => items).flat()
    : items;

  // Find the center occurrence index for the selected value
  const getSelectedIndex = useCallback(() => {
    if (!isInfinite) {
      return items.indexOf(selectedValue);
    }
    // For infinite scroll, use the middle repetition
    const middleRepeat = Math.floor(REPEAT_COUNT / 2);
    const baseIndex = items.indexOf(selectedValue);
    return middleRepeat * items.length + baseIndex;
  }, [items, selectedValue, isInfinite]);

  const selectedIndex = getSelectedIndex();

  useEffect(() => {
    // Center the selected item
    setScrollOffset(-selectedIndex * ITEM_HEIGHT);
  }, [selectedIndex]);

  // Re-center when value changes externally
  useEffect(() => {
    if (selectedValue !== lastSelectedValue) {
      setLastSelectedValue(selectedValue);
      const newIndex = getSelectedIndex();
      setScrollOffset(-newIndex * ITEM_HEIGHT);
    }
  }, [selectedValue, lastSelectedValue, getSelectedIndex]);

  const snapToNearestItem = useCallback((currentOffset: number) => {
    const rawIndex = Math.round(-currentOffset / ITEM_HEIGHT);
    
    if (isInfinite) {
      // For infinite scroll, wrap around to the middle section
      let normalizedIndex = rawIndex;
      const totalItems = displayItems.length;
      const singleSetLength = items.length;
      const middleStart = Math.floor(REPEAT_COUNT / 2) * singleSetLength;
      const middleEnd = middleStart + singleSetLength - 1;
      
      // Clamp to valid range first
      normalizedIndex = Math.max(0, Math.min(totalItems - 1, normalizedIndex));
      
      // Get the actual value at this position
      const actualValue = displayItems[normalizedIndex];
      
      // Calculate the index in the middle section for this value
      const valueIndexInSet = items.indexOf(actualValue);
      const targetIndex = middleStart + valueIndexInSet;
      
      setScrollOffset(-targetIndex * ITEM_HEIGHT);
      
      if (actualValue !== lastSelectedValue) {
        haptic.selection();
        setLastSelectedValue(actualValue);
        onSelect(actualValue);
      }
    } else {
      const newIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
      setScrollOffset(-newIndex * ITEM_HEIGHT);
      const newValue = items[newIndex];
      if (newValue !== lastSelectedValue) {
        haptic.selection();
        setLastSelectedValue(newValue);
        onSelect(newValue);
      }
    }
  }, [displayItems, items, isInfinite, onSelect, lastSelectedValue]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY - scrollOffset);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const newOffset = e.touches[0].clientY - startY;
    setScrollOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    snapToNearestItem(scrollOffset);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY - scrollOffset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newOffset = e.clientY - startY;
    setScrollOffset(newOffset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearestItem(scrollOffset);
  };

  const handleItemClick = (index: number) => {
    const clickedValue = displayItems[index];
    
    if (isInfinite) {
      // Jump to center section for this value
      const singleSetLength = items.length;
      const middleStart = Math.floor(REPEAT_COUNT / 2) * singleSetLength;
      const valueIndexInSet = items.indexOf(clickedValue);
      const targetIndex = middleStart + valueIndexInSet;
      
      setScrollOffset(-targetIndex * ITEM_HEIGHT);
      if (clickedValue !== lastSelectedValue) {
        haptic.selection();
        setLastSelectedValue(clickedValue);
        onSelect(clickedValue);
      }
    } else {
      haptic.selection();
      setLastSelectedValue(clickedValue);
      onSelect(clickedValue);
    }
  };

  // Calculate which index is currently centered
  const currentCenterIndex = Math.round(-scrollOffset / ITEM_HEIGHT);

  return (
    <div 
      ref={containerRef}
      className="relative h-[220px] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ width: 70 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Center highlight bar */}
      <div 
        className="absolute left-0 right-0 bg-muted/50 rounded-lg pointer-events-none"
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)',
          height: ITEM_HEIGHT 
        }}
      />
      
      {/* Items */}
      <div 
        className="flex flex-col items-center transition-transform duration-150"
        style={{ 
          transform: `translateY(${scrollOffset + (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px)`,
          transitionDuration: isDragging ? '0ms' : '150ms'
        }}
      >
        {displayItems.map((item, index) => {
          const distance = Math.abs(index - currentCenterIndex);
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.6 : distance === 2 ? 0.3 : 0.15;
          const scale = distance === 0 ? 1 : 0.85;
          const fontWeight = distance === 0 ? 600 : 400;
          
          return (
            <div
              key={`${item}-${index}`}
              onClick={() => handleItemClick(index)}
              className="flex items-center justify-center transition-all"
              style={{ 
                height: ITEM_HEIGHT,
                opacity,
                transform: `scale(${scale})`,
                fontWeight,
                fontSize: distance === 0 ? 24 : 18,
              }}
            >
              {formatItem ? formatItem(item) : String(item).padStart(2, '0')}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TimeWheelPicker = ({ value, onChange }: TimeWheelPickerProps) => {
  // Parse current value
  const [hours24, minutes] = value.split(':').map(Number);
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  const handleHourChange = (newHour12: number | string) => {
    const hour = Number(newHour12);
    let newHour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;
    onChange(`${String(newHour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  const handleMinuteChange = (newMinute: number | string) => {
    const minute = Number(newMinute);
    onChange(`${String(hours24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  const handlePeriodChange = (newPeriod: number | string) => {
    const periodStr = String(newPeriod) as 'AM' | 'PM';
    let newHour24: number;
    if (periodStr === 'AM') {
      newHour24 = hours12 % 12;
    } else {
      newHour24 = (hours12 % 12) + 12;
    }
    onChange(`${String(newHour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  return (
    <div className="flex justify-center items-center gap-0 py-4">
      <WheelColumn
        items={HOURS_12}
        selectedValue={hours12}
        onSelect={handleHourChange}
        formatItem={(item) => String(item).padStart(2, '0')}
        isInfinite={true}
      />
      <WheelColumn
        items={MINUTES}
        selectedValue={minutes}
        onSelect={handleMinuteChange}
        formatItem={(item) => String(item).padStart(2, '0')}
        isInfinite={true}
      />
      <WheelColumn
        items={PERIODS as unknown as string[]}
        selectedValue={period}
        onSelect={handlePeriodChange}
        formatItem={(item) => String(item)}
        isInfinite={false}
      />
    </div>
  );
};

export default TimeWheelPicker;
