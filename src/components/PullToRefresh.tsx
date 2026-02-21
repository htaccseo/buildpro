import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useStore } from '../lib/store';

export function PullToRefresh({ children }: { children: React.ReactNode }) {
    const { fetchData, currentUser } = useStore();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullY, setPullY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isPulling = useRef(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onTouchStart = (e: TouchEvent) => {
            if (window.scrollY <= 0) {
                startY.current = e.touches[0].clientY;
                isPulling.current = true;
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!isPulling.current || isRefreshing || startY.current === 0) return;

            const y = e.touches[0].clientY;
            const dy = y - startY.current;

            if (dy > 0 && window.scrollY <= 0) {
                // Apply a slowdown factor for a native pulling feel
                const pullDistance = Math.min(dy * 0.4, 80);
                setPullY(pullDistance);
                if (e.cancelable) e.preventDefault(); // Stop native overscroll
            }
        };

        const onTouchEnd = async () => {
            if (!isPulling.current) return;
            isPulling.current = false;
            startY.current = 0;

            if (pullY >= 60 && !isRefreshing && currentUser) {
                setIsRefreshing(true);
                setPullY(60); // Keep the spinner visible while refreshing
                try {
                    await fetchData(currentUser.email);
                } finally {
                    setIsRefreshing(false);
                    setPullY(0);
                }
            } else {
                setPullY(0);
            }
        };

        // Custom event listeners to easily handle cancelable preventDefault
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd);
        el.addEventListener('touchcancel', onTouchEnd);

        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [isRefreshing, pullY, currentUser, fetchData]);

    // Disable completely on desktop (w > 768px)
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
        return <>{children}</>;
    }

    return (
        <div ref={containerRef} className="relative min-h-[calc(100vh-4rem)] md:hidden">
            <div
                className="absolute top-0 left-0 right-0 flex justify-center items-end opacity-0 pointer-events-none"
                style={{
                    height: 60,
                    transform: `translateY(${pullY - 60}px)`,
                    transition: isPulling.current ? 'none' : 'transform 0.2s ease-out'
                }}
            >
                <div className="bg-white rounded-full shadow-md p-2 mb-2 flex items-center justify-center">
                    <Loader2
                        className={`w-6 h-6 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`}
                        style={{ transform: `rotate(${pullY * 4}deg)` }}
                    />
                </div>
            </div>
            <div
                className="min-h-[calc(100vh-4rem)] bg-bg-app transition-transform"
                style={{
                    transform: `translateY(${pullY}px)`,
                    transition: isPulling.current ? 'none' : 'transform 0.2s ease-out'
                }}
            >
                {children}
            </div>
        </div>
    );
}
