import type { CSSProperties } from 'react';

type EditableTextOptions = {
  lineHeight?: number;
  stretch?: boolean;
  transformOrigin?: CSSProperties['transformOrigin'];
};

const MIN_EDITABLE_FONT_SIZE = 16;

function scaledEditableTextStyle(
  visualRem: number,
  { lineHeight = 1, stretch = false, transformOrigin = 'left center' }: EditableTextOptions = {},
): CSSProperties {
  const scale = Number(visualRem.toFixed(4));
  const extraHeight = MIN_EDITABLE_FONT_SIZE * lineHeight * (1 - scale);
  return {
    fontSize: `${MIN_EDITABLE_FONT_SIZE}px`,
    transform: `scale(${scale})`,
    transformOrigin,
    marginTop: `${-(extraHeight / 2)}px`,
    marginBottom: `${-(extraHeight / 2)}px`,
    ...(stretch
      ? {
          width: `${100 / scale}%`,
          marginRight: `${100 - 100 / scale}%`,
        }
      : {}),
  };
}

function scaledEditableControlStyle(
  visualRem: number,
  visualHeight: number,
  style: CSSProperties,
): CSSProperties {
  const scale = Number(visualRem.toFixed(4));
  return {
    ...style,
    fontSize: `${MIN_EDITABLE_FONT_SIZE}px`,
    height: visualHeight / scale,
    width: `${100 / scale}%`,
    borderRadius:
      typeof style.borderRadius === 'number' ? style.borderRadius / scale : style.borderRadius,
    transform: `scale(${scale})`,
    transformOrigin: 'left top',
    marginRight: `${100 - 100 / scale}%`,
    marginBottom: `${visualHeight - visualHeight / scale}px`,
  };
}

export { MIN_EDITABLE_FONT_SIZE, scaledEditableControlStyle, scaledEditableTextStyle };
