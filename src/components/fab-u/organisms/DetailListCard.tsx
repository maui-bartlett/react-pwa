import type { KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Trash2 } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';

const COMMIT_THRESHOLD = 35;
const COMMIT_THRESHOLD_EXTRA = 25;
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
  const [dragX, setDragX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const rowElRef = useRef<HTMLElement | null>(null);
  const commitThresholdRef = useRef(COMMIT_THRESHOLD);
  const committedRef = useRef(false);

  function triggerRemove() {
    setRemoving(true);
    setTimeout(() => onRemove(index), 450);
  }

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      if (Math.abs(deltaX) < commitThresholdRef.current) return;
      committedRef.current = true;
      setSwiping(true);
      setDragX(Math.min(0, deltaX));
    },
    onSwiped: ({ dir, absX }) => {
      setSwiping(false);
      if (
        committedRef.current &&
        dir === 'Left' &&
        absX >= commitThresholdRef.current + COMMIT_THRESHOLD_EXTRA
      ) {
        triggerRemove();
      } else {
        setDragX(0);
      }
    },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  useEffect(() => {
    const el = rowElRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchOriginRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      commitThresholdRef.current = COMMIT_THRESHOLD;
      committedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchOriginRef.current || !e.cancelable) return;
      const dx = Math.abs(e.touches[0].clientX - touchOriginRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchOriginRef.current.y);
      if (committedRef.current || (dx > dy && dx >= commitThresholdRef.current)) {
        e.preventDefault();
      }
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

  const translateX = removing ? '-110%' : `${dragX}px`;
  const rowTransition = swiping
    ? 'none'
    : removing
      ? 'transform 0.15s ease'
      : 'transform 0.22s ease';

  const deleteThreshold = commitThresholdRef.current + COMMIT_THRESHOLD_EXTRA;
  const progress = removing ? 1 : Math.min(Math.abs(dragX) / deleteThreshold, 1);
  const trashOpacity = progress;
  const trashScale = 0.6 + progress * 0.4;
  const iconTransition = swiping ? 'none' : 'opacity 0.22s ease, transform 0.22s ease';
  const showRedChannel = (swiping && dragX < 0) || removing;

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
      {showRedChannel && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: DELETE_RED,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pr: 1.5,
            zIndex: 0,
          }}
        >
          <Box
            style={{
              opacity: trashOpacity,
              transform: `scale(${trashScale})`,
              transition: iconTransition,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={18} color="white" />
          </Box>
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
          transform: `translateX(${translateX})`,
          transition: rowTransition,
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
