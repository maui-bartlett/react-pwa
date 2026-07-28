import { ReactNode } from 'react';

import { SurfaceCard } from '../atoms';
import { SummaryMetric, SummaryMetricsRow } from '../molecules/SummaryMetricsRow';

type SummaryStripProps = {
  metrics: SummaryMetric[];
  label?: string;
  /** Optional element rendered as a middle column between the first and second metric */
  middleAction?: ReactNode;
  /** CSS grid-template-columns for the metrics row. */
  columnsTemplate?: string;
};

function SummaryStrip({ metrics, label, middleAction, columnsTemplate }: SummaryStripProps) {
  return (
    <SurfaceCard label={label}>
      <SummaryMetricsRow
        metrics={metrics}
        middleAction={middleAction}
        columnsTemplate={columnsTemplate}
      />
    </SurfaceCard>
  );
}

export type { SummaryStripProps };
export default SummaryStrip;
