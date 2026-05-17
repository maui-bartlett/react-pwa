import type { KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Pencil, Trash2 } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';

const SNAP_THRESHOLD = 50;
const DELETE_RED = '#d32f2f';

type DetailListItem = {
  title: string;
  subtitle: string;
  trailing?: string;
};

type DetailListCardProps = {
  label: string;
  title?: string;
  items: DetailListItem[];
  subtitle?: string;
  addLabel?: string;
  onAdd?: (event: MouseEvent<HTMLElement>) => void;
  onRemoveItem?: (index: number) => void;
  onItemClick?: (index: number) => void;
};

type SwipeableRowProps = {
  item: DetailListItem;
  index: number;
  onRemove: (index: number) => void;
  onItemClick?: (index: number) => void;
};

function SwipeableRow({ item, index, onRemove, onItemClick }: SwipeableRowProps) {
  const fabUTokens = useFabUTokens();
  const actionWidth = onItemClick ? 128 : 64;
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const rowElRef = useRef<HTMLElement | null>(null);
  const committedRef = useRef(false);

  const visualX = Math.max(-actionWidth, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);

  function triggerRemove() {
    setRemoving(true);
    setSnapX(0);
    setCurrentDeltaX(0);
    setTimeout(() => onRemove(index), 450);
  }

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX, deltaY }) => {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 8) {
        setSwiping(true);
        committedRef.current = true;
      }
      setCurrentDeltaX(deltaX);
    },
    onSwiped: ({ dir, absX }) => {
      setSwiping(false);
      if (dir === 'Left' && absX > SNAP_THRESHOLD && snapX === 0) {
        setSnapX(-actionWidth);
      } else if (dir === 'Right' && absX > SNAP_THRESHOLD && snapX !== 0) {
        setSnapX(0);
      }
      setCurrentDeltaX(0);
      setTimeout(() => {
        committedRef.current = false;
      }, 50);
    },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  useEffect(() => {
    const el = rowElRef.current;
    if (!el) return;

    const onTouchStart = () => {
      committedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!committedRef.current || !e.cancelable) return;
      e.preventDefault();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const setRef = (el: HTMLElement | null) => {
    swipeHandlers.ref(el);
    rowElRef.current = el;
  };

  return (
    <Box
      data-pw="detail-list-row"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '9px',
        maxHeight: removing ? 0 : '200px',
        opacity: removing ? 0 : 1,
        transition: removing ? 'max-height 0.32s ease 0.1s, opacity 0.22s ease 0.1s' : 'none',
      }}
    >
      {/* Action channel */}
      {channelVisible && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: actionWidth,
            display: 'flex',
            zIndex: 0,
          }}
        >
          <Box
            onClick={(e) => {
              e.stopPropagation();
              triggerRemove();
            }}
            sx={{
              flex: 1,
              bgcolor: DELETE_RED,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={18} color="white" />
          </Box>
          {onItemClick ? (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                setSnapX(0);
                setCurrentDeltaX(0);
                onItemClick(index);
              }}
              sx={{
                flex: 1,
                bgcolor: fabUTokens.color.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Pencil size={18} color="white" />
            </Box>
          ) : null}
        </Box>
      )}

      <Stack
        {...swipeHandlers}
        ref={setRef}
        direction="row"
        justifyContent="space-between"
        gap={2}
        onClick={() => {
          if (committedRef.current) return;
          if (onItemClick) onItemClick(index);
        }}
        sx={{
          position: 'relative',
          zIndex: 1,
          border: `1px solid ${fabUTokens.color.border}`,
          borderRadius: '9px',
          px: 1.25,
          py: 1,
          bgcolor: fabUTokens.color.surface,
          boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12)',
          transform: `translateX(${visualX}px)`,
          transition: swiping ? 'none' : 'transform 0.22s ease',
          touchAction: 'pan-y',
          userSelect: 'none',
          cursor: onItemClick ? 'pointer' : 'default',
        }}
      >
        <Stack spacing={0.35}>
          <Typography
            variant="body2"
            sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '0.9rem' }}
          >
            {item.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.68rem', lineHeight: 1.4 }}
          >
            {item.subtitle}
          </Typography>
        </Stack>
        {item.trailing ? (
          <Typography
            variant="caption"
            sx={{
              color: fabUTokens.color.brandText,
              fontWeight: 700,
              fontSize: '0.68rem',
              whiteSpace: 'nowrap',
            }}
          >
            {item.trailing}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

function DetailListCard({
  label,
  title,
  items,
  subtitle,
  addLabel,
  onAdd,
  onRemoveItem,
  onItemClick,
}: DetailListCardProps) {
  const fabUTokens = useFabUTokens();
  const handleAddKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onAdd || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onAdd(event as unknown as MouseEvent<HTMLElement>);
  };

  return (
    <SurfaceCard label={label} title={title} subtitle={subtitle}>
      <Stack spacing={1}>
        {items.map((item, index) =>
          onRemoveItem ? (
            <SwipeableRow
              key={`${item.title}-${item.subtitle}`}
              item={item}
              index={index}
              onRemove={onRemoveItem}
              onItemClick={onItemClick}
            />
          ) : (
            <Stack
              key={`${item.title}-${item.subtitle}`}
              data-pw="detail-list-row"
              direction="row"
              justifyContent="space-between"
              gap={2}
              onClick={() => onItemClick?.(index)}
              sx={{
                border: `1px solid ${fabUTokens.color.border}`,
                borderRadius: '9px',
                px: 1.25,
                py: 1,
                bgcolor: fabUTokens.color.surface,
                boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12)',
                cursor: onItemClick ? 'pointer' : 'default',
              }}
            >
              <Stack spacing={0.35}>
                <Typography
                  variant="body2"
                  sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '0.9rem' }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: fabUTokens.color.textSecondary,
                    fontSize: '0.68rem',
                    lineHeight: 1.4,
                  }}
                >
                  {item.subtitle}
                </Typography>
              </Stack>
              {item.trailing ? (
                <Typography
                  variant="caption"
                  sx={{
                    color: fabUTokens.color.brandText,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.trailing}
                </Typography>
              ) : null}
            </Stack>
          ),
        )}

        {addLabel ? (
          <Box
            role="button"
            tabIndex={0}
            onClick={onAdd}
            onKeyDown={handleAddKeyDown}
            sx={{
              border: `1px dashed ${fabUTokens.color.highlight}`,
              borderRadius: '9px',
              px: 1.3,
              py: 1.45,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: fabUTokens.color.highlight,
              bgcolor: alpha(fabUTokens.color.highlight, 0.12),
              cursor: 'pointer',
            }}
          >
            <AddIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {addLabel}
            </Typography>
          </Box>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}

export default DetailListCard;
