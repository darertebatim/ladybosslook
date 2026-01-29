import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface TimeWheelPickerProps {
  value: string; // "HH:mm" format
  onChange: (value: string) => void;
}

// Generate arrays for picker
const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 10, 20, 30, 40, 50]; // 10-minute increments for easier selection
const PERIODS = ['AM', 'PM'] as const;

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

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
  const [momentum, setMomentum] = useState(0);
  const lastTouchY = useRef(0);
  const lastTouchTime = useRef(0);
  const animationRef = useRef<number | null>(null);

  // For infinite scroll, we create a virtual list that's 3x the original
  // This gives us room to scroll in both directions before needing to "reset"
  const multiplier = isInfinite ? 3 : 1;
  const totalItems = items.length * multiplier;
  
  // Find the index in the middle set that matches our selected value
  const getSelectedIndex = useCallback(() => {
    const baseIndex = items.indexOf(selectedValue);
    if (baseIndex === -1) return 0;
    // Start in the middle set
    return isInfinite ? items.length + baseIndex : baseIndex;
  }, [items, selectedValue, isInfinite]);

  // Initialize scroll position
  useEffect(() => {
    const idx = getSelectedIndex();
    setScrollOffset(-idx * ITEM_HEIGHT);
  }, []);

  // When value changes externally, update position
  useEffect(() => {
    if (!isDragging) {
      const idx = getSelectedIndex();
      setScrollOffset(-idx * ITEM_HEIGHT);
    }
  }, [selectedValue, isDragging, getSelectedIndex]);

  // Get the actual item at any index (handles wrapping for infinite)
  const getItemAtIndex = (index: number): string | number => {
    if (!isInfinite) {
      return items[Math.max(0, Math.min(items.length - 1, index))];
    }
    // Wrap the index to always be within bounds
    const wrappedIndex = ((index % items.length) + items.length) % items.length;
    return items[wrappedIndex];
  };

  // Snap to nearest item and handle infinite wrapping
  const snapToNearest = useCallback((currentOffset: number, shouldAnimate: boolean = true) => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const rawIndex = Math.round(-currentOffset / ITEM_HEIGHT);
    
    if (isInfinite) {
      // Clamp to valid range for the 3x list
      const clampedIndex = Math.max(0, Math.min(totalItems - 1, rawIndex));
      const newOffset = -clampedIndex * ITEM_HEIGHT;
      
      // Get the actual value
      const actualValue = getItemAtIndex(clampedIndex);
      
      // Update offset
      setScrollOffset(newOffset);
      
      // Notify parent if value changed
      if (actualValue !== selectedValue) {
        haptic.selection();
        onSelect(actualValue);
      }
      
      // After animation completes, silently recenter to middle set
      if (shouldAnimate) {
        setTimeout(() => {
          const valueIndex = items.indexOf(actualValue);
          const middleIndex = items.length + valueIndex;
          const currentIndex = clampedIndex;
          
          // Only recenter if we're far from the middle
          if (Math.abs(currentIndex - middleIndex) > items.length / 2) {
            setScrollOffset(-middleIndex * ITEM_HEIGHT);
          }
        }, 160);
      }
    } else {
      const newIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
      const newOffset = -newIndex * ITEM_HEIGHT;
      setScrollOffset(newOffset);
      
      const newValue = items[newIndex];
      if (newValue !== selectedValue) {
        haptic.selection();
        onSelect(newValue);
      }
    }
  }, [items, selectedValue, isInfinite, totalItems, onSelect, getItemAtIndex]);

  // Handle momentum scrolling
  const applyMomentum = useCallback((velocity: number) => {
    if (Math.abs(velocity) < 0.5) {
      snapToNearest(scrollOffset);
      return;
    }

    const decay = 0.92;
    let currentVelocity = velocity;
    let currentOffset = scrollOffset;

    const animate = () => {
      currentVelocity *= decay;
      currentOffset += currentVelocity;

      // Clamp offset for non-infinite
      if (!isInfinite) {
        const minOffset = -(items.length - 1) * ITEM_HEIGHT;
        const maxOffset = 0;
        currentOffset = Math.max(minOffset, Math.min(maxOffset, currentOffset));
      }

      setScrollOffset(currentOffset);

      if (Math.abs(currentVelocity) > 0.5) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        snapToNearest(currentOffset);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [scrollOffset, items.length, isInfinite, snapToNearest]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsDragging(true);
    setStartY(e.touches[0].clientY - scrollOffset);
    lastTouchY.current = e.touches[0].clientY;
    lastTouchTime.current = Date.now();
    setMomentum(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const newOffset = currentY - startY;
    
    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastTouchTime.current;
    if (dt > 0) {
      const velocity = (currentY - lastTouchY.current) / dt * 16; // normalize to ~60fps
      setMomentum(velocity);
    }
    
    lastTouchY.current = currentY;
    lastTouchTime.current = now;
    
    setScrollOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (Math.abs(momentum) > 2) {
      applyMomentum(momentum);
    } else {
      snapToNearest(scrollOffset);
    }
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsDragging(true);
    setStartY(e.clientY - scrollOffset);
    lastTouchY.current = e.clientY;
    lastTouchTime.current = Date.now();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const newOffset = currentY - startY;
    
    const now = Date.now();
    const dt = now - lastTouchTime.current;
    if (dt > 0) {
      const velocity = (currentY - lastTouchY.current) / dt * 16;
      setMomentum(velocity);
    }
    
    lastTouchY.current = currentY;
    lastTouchTime.current = now;
    
    setScrollOffset(newOffset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (Math.abs(momentum) > 2) {
      applyMomentum(momentum);
    } else {
      snapToNearest(scrollOffset);
    }
  };

  const handleItemClick = (index: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const newOffset = -index * ITEM_HEIGHT;
    setScrollOffset(newOffset);
    
    const clickedValue = getItemAtIndex(index);
    if (clickedValue !== selectedValue) {
      haptic.selection();
      onSelect(clickedValue);
    }
  };

  // Calculate which index is currently centered
  const currentCenterIndex = Math.round(-scrollOffset / ITEM_HEIGHT);

  // Generate display items
  const displayItems = isInfinite
    ? Array.from({ length: totalItems }, (_, i) => getItemAtIndex(i))
    : items;

  return (
    <div 
      ref={containerRef}
      className="relative h-[220px] overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
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
        className={cn(
          "flex flex-col items-center",
          !isDragging && "transition-transform duration-150"
        )}
        style={{ 
          transform: `translateY(${scrollOffset + (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px)`,
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
              className="flex items-center justify-center cursor-pointer"
              style={{ 
                height: ITEM_HEIGHT,
                opacity,
                transform: `scale(${scale})`,
                fontWeight,
                fontSize: distance === 0 ? 24 : 18,
                transition: isDragging ? 'none' : 'opacity 150ms, transform 150ms',
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
  
  // Snap minutes to nearest 10 for display
  const displayMinutes = Math.round(minutes / 10) * 10 % 60;

  const handleHourChange = (newHour12: number | string) => {
    const hour = Number(newHour12);
    let newHour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;
    onChange(`${String(newHour24).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}`);
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
        selectedValue={displayMinutes}
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
