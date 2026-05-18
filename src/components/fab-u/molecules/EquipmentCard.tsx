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
import { EquipmentItem } from '../types';

const ACTION_WIDTH = 128;
const SNAP_THRESHOLD = 50;
const DELETE_RED = '#a84e49';

type EquipmentCardProps = {
  title?: string;
  items: EquipmentItem[];
  emptyLabel?: string;
  label?: string;
  onDeleteItem?: (index: number) => void;
  onUpdateItem?: (index: number, updated: EquipmentItem) => void;
  onAddItem?: () => void;
};

type EquipmentRowProps = {
  item: EquipmentItem;
  index: number;
  isEditing: boolean;
  nameDraft: string;
  descDraft: string;
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onStartEdit: () => void;
  onCommitEdit: () => void;
  onRevertEdit: () => void;
  onDelete?: (index: number) => void;
};

function EquipmentRow({
  item,
  index,
  isEditing,
  nameDraft,
  descDraft,
  onNameChange,
  onDescChange,
  onStartEdit,
  onCommitEdit,
  onRevertEdit,
  onDelete,
}: EquipmentRowProps) {
  const fabUTokens = useFabUTokens();
  const deleteColor = fabUTokens.isDark ? DELETE_RED : '#c05c57';
  const editColor = fabUTokens.isDark ? '#3d7060' : '#4d8070';
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const rowElRef = useRef<HTMLElement | null>(null);
  const committedRef = useRef(false);

  const visualX = Math.max(-ACTION_WIDTH, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);
  const swipeFraction = Math.abs(visualX) / ACTION_WIDTH;

  function triggerRemove() {
    setRemoving(true);
    setSnapX(0);
    setCurrentDeltaX(0);
    setTimeout(() => onDelete?.(index), 450);
  }

  function startEdit() {
    setSnapX(0);
    setCurrentDeltaX(0);
    onStartEdit();
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
        setSnapX(-ACTION_WIDTH);
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

  if (isEditing) {
    return (
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '9px',
          boxShadow: fabUTokens.shadow.card,
          maxHeight: removing ? 0 : '200px',
          opacity: removing ? 0 : 1,
          transition: removing ? 'max-height 0.32s ease 0.1s, opacity 0.22s ease 0.1s' : 'none',
        }}
      >
        <Box
          sx={{
            border: `1px solid ${fabUTokens.color.textSecondary}`,
            borderRadius: '9px',
            px: 1.3,
            py: 0.95,
            bgcolor: fabUTokens.color.pillSurface,
            boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12)',
          }}
        >
          <Stack spacing={0.45}>
            <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
              <InputBase
                autoFocus
                value={nameDraft}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCommitEdit();
                  if (e.key === 'Escape') onRevertEdit();
                }}
                sx={{
                  flex: 1,
                  '& input': {
                    p: 0,
                    fontWeight: 700,
                    ...scaledEditableTextStyle(0.9, { lineHeight: 1.5, stretch: true }),
                    color: fabUTokens.color.textPrimary,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: fabUTokens.color.textSecondary,
                  textTransform: 'uppercase',
                  fontSize: '0.6rem',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {item.slot}
              </Typography>
            </Stack>
            <InputBase
              value={descDraft}
              onChange={(e) => onDescChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onRevertEdit();
              }}
              placeholder="Description"
              sx={{
                '& input': {
                  p: 0,
                  ...scaledEditableTextStyle(0.78, { lineHeight: 1.45, stretch: true }),
                  color: fabUTokens.color.textSecondary,
                },
              }}
            />
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '9px',
        boxShadow: fabUTokens.shadow.card,
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
            width: ACTION_WIDTH,
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
              bgcolor: deleteColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.2), inset 0 -3px 8px rgba(0,0,0,0.2)',
            }}
          >
            <Trash2 size={18} color="white" />
          </Box>
          <Box
            onClick={(e) => {
              e.stopPropagation();
              startEdit();
            }}
            sx={{
              flex: 1,
              bgcolor: editColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow:
                'inset -3px 0 8px rgba(0,0,0,0.3), inset 0 3px 8px rgba(0,0,0,0.18), inset 0 -3px 8px rgba(0,0,0,0.18)',
            }}
          >
            <Pencil size={18} color="white" />
          </Box>
        </Box>
      )}

      <Box
        {...swipeHandlers}
        ref={setRef}
        sx={{
          position: 'relative',
          zIndex: 1,
          border: `1px solid ${fabUTokens.color.border}`,
          borderRadius: visualX < 0 ? '9px 0 0 9px' : '9px',
          px: 1.3,
          py: 0.95,
          bgcolor: fabUTokens.color.surface,
          boxShadow: `inset 3px 0 0 rgba(49, 92, 77, 0.12), 6px 0 12px rgba(0,0,0,${(swipeFraction * 0.28).toFixed(3)})`,
          transform: `translateX(${visualX}px)`,
          transition: swiping ? 'none' : 'transform 0.22s ease',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        <Stack spacing={0.45}>
          <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
            <Typography
              variant="body1"
              sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '0.9rem' }}
            >
              {item.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: fabUTokens.color.textSecondary,
                textTransform: 'uppercase',
                fontSize: '0.6rem',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              {item.slot}
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: fabUTokens.color.textSecondary,
              fontSize: '0.78rem',
              lineHeight: 1.45,
            }}
          >
            {item.description}
          </Typography>
          {item.weight || item.tags?.length ? (
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography
                variant="caption"
                sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.66rem' }}
              >
                {item.tags?.join(' · ')}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: fabUTokens.color.warning,
                  fontWeight: 700,
                  fontSize: '0.66rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.weight}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}

function EquipmentCard({
  title = 'Equipped gear',
  items,
  emptyLabel = 'Open accessory slot',
  label = 'Gear',
  onDeleteItem,
  onUpdateItem,
  onAddItem,
}: EquipmentCardProps) {
  const fabUTokens = useFabUTokens();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');

  function startEdit(index: number) {
    setNameDraft(items[index].name);
    setDescDraft(items[index].description);
    setEditingIndex(index);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    onUpdateItem?.(editingIndex, {
      ...items[editingIndex],
      name: nameDraft,
      description: descDraft,
    });
    setEditingIndex(null);
  }

  function revertEdit() {
    setEditingIndex(null);
  }

  return (
    <SurfaceCard
      label={label}
      title={title || undefined}
      actions={
        editingIndex !== null ? (
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
      <Stack spacing={1.05}>
        {items.map((item, index) => (
          <EquipmentRow
            key={`${item.slot}-${item.name}-${index}`}
            item={item}
            index={index}
            isEditing={editingIndex === index}
            nameDraft={editingIndex === index ? nameDraft : item.name}
            descDraft={editingIndex === index ? descDraft : item.description}
            onNameChange={setNameDraft}
            onDescChange={setDescDraft}
            onStartEdit={() => startEdit(index)}
            onCommitEdit={commitEdit}
            onRevertEdit={revertEdit}
            onDelete={onDeleteItem}
          />
        ))}

        <Box
          onClick={onAddItem}
          sx={{
            border: `1px dashed ${fabUTokens.color.highlight}`,
            borderRadius: '9px',
            px: 1.3,
            py: 1.45,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: fabUTokens.color.highlight,
            bgcolor: 'transparent',
            cursor: onAddItem ? 'pointer' : 'default',
          }}
        >
          <AddIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
            {emptyLabel}
          </Typography>
        </Box>
      </Stack>
    </SurfaceCard>
  );
}

export default EquipmentCard;
