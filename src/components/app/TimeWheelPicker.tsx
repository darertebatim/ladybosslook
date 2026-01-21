import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimeWheelPickerProps {
  value: string; // "HH:mm" format
  onChange: (value: string) => void;
}

// Generate arrays for picker
const HOURS_12 = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'] as const;

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

interface WheelColumnProps {
  items: (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem?: (item: string | number) => string;
}

const WheelColumn = ({ items, selectedIndex, onSelect, formatItem }: WheelColumnProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    // Center the selected item
    setScrollOffset(-selectedIndex * ITEM_HEIGHT);
  }, [selectedIndex]);

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
    // Snap to nearest item
    const rawIndex = Math.round(-scrollOffset / ITEM_HEIGHT);
    const newIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
    setScrollOffset(-newIndex * ITEM_HEIGHT);
    if (newIndex !== selectedIndex) {
      onSelect(newIndex);
    }
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
    const rawIndex = Math.round(-scrollOffset / ITEM_HEIGHT);
    const newIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
    setScrollOffset(-newIndex * ITEM_HEIGHT);
    if (newIndex !== selectedIndex) {
      onSelect(newIndex);
    }
  };

  const handleItemClick = (index: number) => {
    onSelect(index);
  };

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
        {items.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
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
  
  // Find indices
  const hourIndex = HOURS_12.indexOf(hours12);
  const minuteIndex = minutes;
  const periodIndex = PERIODS.indexOf(period);

  const handleHourChange = (index: number) => {
    const newHour12 = HOURS_12[index];
    let newHour24 = period === 'PM' ? (newHour12 % 12) + 12 : newHour12 % 12;
    onChange(`${String(newHour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  const handleMinuteChange = (index: number) => {
    onChange(`${String(hours24).padStart(2, '0')}:${String(index).padStart(2, '0')}`);
  };

  const handlePeriodChange = (index: number) => {
    const newPeriod = PERIODS[index];
    let newHour24: number;
    if (newPeriod === 'AM') {
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
        selectedIndex={hourIndex >= 0 ? hourIndex : 0}
        onSelect={handleHourChange}
        formatItem={(item) => String(item).padStart(2, '0')}
      />
      <WheelColumn
        items={MINUTES}
        selectedIndex={minuteIndex}
        onSelect={handleMinuteChange}
        formatItem={(item) => String(item).padStart(2, '0')}
      />
      <WheelColumn
        items={PERIODS as unknown as string[]}
        selectedIndex={periodIndex >= 0 ? periodIndex : 0}
        onSelect={handlePeriodChange}
        formatItem={(item) => String(item)}
      />
    </div>
  );
};

export default TimeWheelPicker;
