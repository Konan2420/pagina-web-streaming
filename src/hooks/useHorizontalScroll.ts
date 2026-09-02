import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type DragState = {
  pointerId: number | null;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
};

/**
 * Añade desplazamiento horizontal con rueda y arrastre de mouse a una fila.
 * Los gestos táctiles se dejan al navegador para conservar el swipe nativo.
 */
export function useHorizontalScroll() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState>({ pointerId: null, startX: 0, startScrollLeft: 0, moved: false });
  const ignoreClickUntil = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [edges, setEdges] = useState({ hasStartOverflow: false, hasEndOverflow: false });

  const updateEdges = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
    const nextEdges = {
      hasStartOverflow: element.scrollLeft > 1,
      hasEndOverflow: maxScrollLeft - element.scrollLeft > 1,
    };

    setEdges((current) =>
      current.hasStartOverflow === nextEdges.hasStartOverflow &&
      current.hasEndOverflow === nextEdges.hasEndOverflow
        ? current
        : nextEdges,
    );
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      if (maxScrollLeft <= 0) return;

      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;

      const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, element.scrollLeft + delta));
      if (nextScrollLeft === element.scrollLeft) return;

      event.preventDefault();
      element.scrollLeft = nextScrollLeft;
    };

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateEdges);
    const mutationObserver = new MutationObserver(updateEdges);

    updateEdges();
    element.addEventListener("scroll", updateEdges, { passive: true });
    element.addEventListener("wheel", onWheel, { passive: false });
    resizeObserver?.observe(element);
    mutationObserver.observe(element, { childList: true, subtree: true });

    return () => {
      element.removeEventListener("scroll", updateEdges);
      element.removeEventListener("wheel", onWheel);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateEdges]);

  const finishDrag = useCallback((pointerId: number) => {
    const element = scrollRef.current;
    if (dragRef.current.pointerId !== pointerId) return;

    if (dragRef.current.moved) ignoreClickUntil.current = Date.now() + 180;
    if (element?.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    dragRef.current.pointerId = null;
    setIsDragging(false);
    updateEdges();
  }, [updateEdges]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    // En táctil dejamos que el navegador conserve el swipe y la inercia nativos.
    if (event.pointerType === "touch" || event.button !== 0) return;

    const element = scrollRef.current;
    if (!element || element.scrollWidth <= element.clientWidth) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: element.scrollLeft,
      moved: false,
    };
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const element = scrollRef.current;
    if (!element || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    // No capturamos el puntero al presionar: hacerlo inmediatamente sobre un
    // botón puede impedir que su click nativo llegue al handler. Solo un
    // desplazamiento intencional convierte la interacción en arrastre.
    if (!drag.moved) {
      if (Math.abs(distance) < 6) return;
      drag.moved = true;
      element.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    event.preventDefault();
    element.scrollLeft = drag.startScrollLeft - distance;
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => finishDrag(event.pointerId),
    [finishDrag],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => finishDrag(event.pointerId),
    [finishDrag],
  );

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() >= ignoreClickUntil.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    scrollRef,
    isDragging,
    ...edges,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  };
}
