import type { KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CheckCircle, Pencil, Trash2, XCircle } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { scaledEditableTextStyle } from '../editableText';

const SNAP_THRESHOLD = 50;
const DELETE_RED = '#a84e49';

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
  onRemoveItem?: (index: number, onCancel?: () => void, onBeforeConfirm?: () => void) => void;
  onItemClick?: (index: number) => void;
  onEditItem?: (index: number, updated: { title: string; subtitle: string }) => void;
  hideDelete?: boolean;
};

type SwipeableRowProps = {
  item: DetailListItem;
  index: number;
  isEditing: boolean;
  titleDraft: string;
  subtitleDraft: string;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  /** Called after swipe closes. Use for inline edit start OR navigation fallback. */
  onEditChannelClick?: () => void;
  onCommitEdit: () => void;
  onRevertEdit: () => void;
  onRemove: (index: number, onCancel?: () => void, onBeforeConfirm?: () => void) => void;
  onItemClick?: (index: number) => void;
  hideDelete?: boolean;
};

function SwipeableRow({
  item,
  index,
  isEditing,
  titleDraft,
  subtitleDraft,
  onTitleChange,
  onSubtitleChange,
  onEditChannelClick,
  onCommitEdit,
  onRevertEdit,
  onRemove,
  onItemClick,
  hideDelete,
}: SwipeableRowProps) {
  const fabUTokens = useFabUTokens();
  const deleteColor = fabUTokens.isDark ? DELETE_RED : '#c05c57';
  const editColor = fabUTokens.isDark ? '#3d7060' : '#4d8070';
  const actionWidth = hideDelete ? (onEditChannelClick ? 64 : 0) : onEditChannelClick ? 128 : 64;
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing] = useState(false);
  const [exitingLeft, setExitingLeft] = useState(false);
  const rowElRef = useRef<HTMLElement | null>(null);
  const committedRef = useRef(false);

  const visualX = Math.max(-actionWidth, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);
  const swipeFraction = Math.abs(visualX) / actionWidth;

  function handleEditChannel() {
    setSnapX(0);
    setCurrentDeltaX(0);
    onEditChannelClick?.();
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

  // Reset swipe position when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setSnapX(0);
      setCurrentDeltaX(0);
      setSwiping(false);
    }
  }, [isEditing]);

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
        boxShadow: fabUTokens.shadow.card,
        ...(exitingLeft
          ? {
              maxHeight: 0,
              transition: 'max-height 60ms ease-in 340ms',
            }
          : {
              maxHeight: removing ? 0 : '200px',
              opacity: removing ? 0 : 1,
              transition: removing ? 'max-height 0.32s ease 0.1s, opacity 0.22s ease 0.1s' : 'none',
            }),
      }}
    >
      {/* Action channel */}
      {(channelVisible || exitingLeft) && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: actionWidth,
            display: 'flex',
            zIndex: 0,
            ...(exitingLeft && { opacity: 0, transition: 'opacity 250ms ease-in' }),
          }}
        >
          {!hideDelete && (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                onRemove(
                  index,
                  () => {
                    setSnapX(0);
                    setCurrentDeltaX(0);
                  },
                  () => {
                    setExitingLeft(true);
                  },
                );
              }}
              sx={{
                flex: 1,
                bgcolor: deleteColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={18} color="white" />
            </Box>
          )}
          {onEditChannelClick ? (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                handleEditChannel();
              }}
              sx={{
                flex: 1,
                bgcolor: editColor,
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
        {...(!isEditing ? swipeHandlers : {})}
        ref={!isEditing ? setRef : undefined}
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
          border: `1px solid ${isEditing ? fabUTokens.color.textSecondary : fabUTokens.color.border}`,
          borderRadius: visualX < 0 ? '9px 0 0 9px' : '9px',
          px: 1.25,
          py: 1,
          bgcolor: fabUTokens.color.pillSurface,
          boxShadow: `inset 3px 0 0 rgba(49, 92, 77, 0.12), 6px 0 12px rgba(0,0,0,${(swipeFraction * 0.28).toFixed(3)})`,
          transform: isEditing
            ? 'none'
            : exitingLeft
              ? 'translateX(-200%)'
              : `translateX(${visualX}px)`,
          transition: exitingLeft
            ? 'transform 350ms ease-in'
            : swiping
              ? 'none'
              : 'transform 0.22s ease',
          touchAction: isEditing ? 'auto' : 'pan-y',
          userSelect: 'none',
          cursor: onItemClick ? 'pointer' : 'default',
        }}
      >
        <Stack spacing={0.35}>
          {isEditing ? (
            <>
              <InputBase
                autoFocus
                value={titleDraft}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCommitEdit();
                  if (e.key === 'Escape') onRevertEdit();
                }}
                sx={{
                  '& input': {
                    p: 0,
                    fontWeight: 700,
                    ...scaledEditableTextStyle(0.9, { lineHeight: 1.5, stretch: true }),
                    color: fabUTokens.color.textPrimary,
                  },
                }}
              />
              <InputBase
                value={subtitleDraft}
                onChange={(e) => onSubtitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onRevertEdit();
                }}
                sx={{
                  '& input': {
                    p: 0,
                    ...scaledEditableTextStyle(0.68, { lineHeight: 1.4, stretch: true }),
                    color: fabUTokens.color.textSecondary,
                  },
                }}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </Stack>
        {item.trailing ? (
          <Typography
            variant="caption"
            sx={{
              color: fabUTokens.isDark ? fabUTokens.color.brandText : '#3d7060',
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
  onEditItem,
  hideDelete,
}: DetailListCardProps) {
  const fabUTokens = useFabUTokens();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [subtitleDraft, setSubtitleDraft] = useState('');

  function startEdit(index: number) {
    setTitleDraft(items[index].title);
    setSubtitleDraft(items[index].subtitle);
    setEditingIndex(index);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    onEditItem?.(editingIndex, {
      title: titleDraft.trim() || items[editingIndex].title,
      subtitle: subtitleDraft.trim(),
    });
    setEditingIndex(null);
  }

  function revertEdit() {
    setEditingIndex(null);
  }

  const handleAddKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onAdd || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onAdd(event as unknown as MouseEvent<HTMLElement>);
  };

  return (
    <SurfaceCard
      label={label}
      title={title}
      subtitle={subtitle}
      actions={
        editingIndex !== null && onEditItem ? (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box
              component="button"
              type="button"
              onClick={commitEdit}
              sx={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <CheckCircle size={28} color="#4caf50" />
            </Box>
            <Box
              component="button"
              type="button"
              onClick={revertEdit}
              sx={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <XCircle size={28} color="#a84e49" />
            </Box>
          </Box>
        ) : undefined
      }
      actionsPosition="inline"
    >
      <Stack spacing={1}>
        {items.map((item, index) =>
          onRemoveItem || onEditItem ? (
            <SwipeableRow
              key={`${item.title}-${item.subtitle}`}
              item={item}
              index={index}
              isEditing={editingIndex === index}
              titleDraft={editingIndex === index ? titleDraft : item.title}
              subtitleDraft={editingIndex === index ? subtitleDraft : item.subtitle}
              onTitleChange={setTitleDraft}
              onSubtitleChange={setSubtitleDraft}
              onEditChannelClick={
                onEditItem
                  ? () => startEdit(index)
                  : onItemClick
                    ? () => onItemClick(index)
                    : undefined
              }
              onCommitEdit={commitEdit}
              onRevertEdit={revertEdit}
              onRemove={onRemoveItem ?? (() => {})}
              onItemClick={onItemClick}
              hideDelete={hideDelete}
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
                bgcolor: fabUTokens.color.pillSurface,
                boxShadow: `inset 3px 0 0 rgba(49, 92, 77, 0.12), ${fabUTokens.shadow.card}`,
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
              bgcolor: fabUTokens.isDark ? 'transparent' : '#ffffff',
              cursor: 'pointer',
              boxShadow: fabUTokens.shadow.card,
            }}
          >
            <AddIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
              {addLabel}
            </Typography>
          </Box>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}

export default DetailListCard;
