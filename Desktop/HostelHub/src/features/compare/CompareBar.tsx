/**
 * Floating strip that appears at the bottom of every page once the user
 * has added ≥ 1 listing to the compare set. Shows mini thumbnails, a count,
 * a "Compare" button that opens the drawer, and a clear button.
 *
 * Positioning:
 *   mobile  — bottom-14 (sits above the BottomNav)
 *   desktop — bottom-0  (BottomNav is hidden on sm+)
 */
import { BarChart2, X } from 'lucide-react';
import { useCompareStore } from '@/stores/compareStore';
import Button from '@/components/ui/Button';

export default function CompareBar() {
  const ids = useCompareStore((s) => s.ids);
  const clear = useCompareStore((s) => s.clear);
  const openDrawer = useCompareStore((s) => s.openDrawer);

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-14 z-20 border-t border-border bg-bg-card/95 px-4 py-2.5 backdrop-blur sm:bottom-0">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        {/* Count badge */}
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {ids.length}
        </span>

        <p className="flex-1 text-sm font-medium text-text">
          {ids.length === 1
            ? '1 listing selected'
            : `${ids.length} listings selected`}
          <span className="ml-1 text-text-muted">(max 4)</span>
        </p>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<BarChart2 className="h-4 w-4" />}
          onClick={openDrawer}
          disabled={ids.length < 2}
        >
          Compare
        </Button>

        <button
          type="button"
          aria-label="Clear compare selection"
          onClick={clear}
          className="rounded-full p-1.5 text-text-muted transition hover:bg-bg-hover hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
