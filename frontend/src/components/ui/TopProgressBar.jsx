import { useEffect, useRef, useState } from 'react';
import { subscribeLoading } from '../../lib/loadingBus';

const SHOW_DELAY = 150; // don't flash the bar for near-instant requests
const HIDE_DELAY = 300; // let the completed (100%) state register briefly

/**
 * App-wide progress bar tied to real in-flight API activity (see
 * lib/loadingBus.js + lib/api.js) rather than a fake timer — so it's
 * accurate for everything from a login request to a dashboard fetch to
 * a form submit, with zero per-page wiring required. Mounted once in
 * App.jsx above <Routes>.
 */
export default function TopProgressBar() {
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState(false);
  const shownRef = useRef(false);
  const showTimeout = useRef(null);
  const hideTimeout = useRef(null);
  const trickleInterval = useRef(null);

  useEffect(() => {
    function startTrickle() {
      setShown(true);
      shownRef.current = true;
      setProgress(12);
      clearInterval(trickleInterval.current);
      trickleInterval.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.15));
      }, 180);
    }

    function finish() {
      clearInterval(trickleInterval.current);
      setProgress(100);
      hideTimeout.current = setTimeout(() => {
        setShown(false);
        shownRef.current = false;
        setProgress(0);
      }, HIDE_DELAY);
    }

    return subscribeLoading((count) => {
      if (count > 0) {
        clearTimeout(hideTimeout.current);
        if (!shownRef.current && !showTimeout.current) {
          showTimeout.current = setTimeout(() => {
            showTimeout.current = null;
            startTrickle();
          }, SHOW_DELAY);
        }
      } else {
        clearTimeout(showTimeout.current);
        showTimeout.current = null;
        if (shownRef.current) finish();
      }
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: shown ? 1 : 0, transition: 'opacity 200ms ease' }}
    >
      <div
        className="h-full bg-gradient-to-r from-route-500 via-accent-400 to-route-500 shadow-[0_0_8px_1px_rgba(226,163,59,0.5)]"
        style={{ width: `${progress}%`, transition: 'width 200ms ease' }}
      />
    </div>
  );
}
