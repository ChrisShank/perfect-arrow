import { AbstractArrow } from './abstract-arrow.js';
import { verticesToPolygon, Vertex } from './convex-hull.js';

export class XanaduLink extends AbstractArrow {
  static tagName = 'xanadu-link';

  render(
    sourceRect: DOMRectReadOnly,
    targetRect: DOMRectReadOnly,
    sourceElement: Element,
    targetElement: Element
  ): void {
    // If the right side of the target is to the left of the right side of the source then swap them
    if (sourceRect.x + sourceRect.width > targetRect.x + targetRect.width) {
      const temp = sourceRect;
      sourceRect = targetRect;
      targetRect = temp;
    }

    let sourceVertices = computeInlineVertices(Array.from(sourceElement.getClientRects()));
    const targetVertices = computeInlineVertices(Array.from(targetElement.getClientRects()));

    if (sourceVertices.length === 0 || targetVertices.length === 0) {
      this.style.clipPath = '';
      return;
    }

    // To trace the link we need to rotate the vertices of the source to start on the bottom right corner.
    const maxRightCoordinate = Math.max.apply(
      null,
      sourceVertices.map((vertex) => vertex.x)
    );
    const maxBottomCoordinate = Math.max.apply(
      null,
      sourceVertices.filter((vertex) => vertex.x === maxRightCoordinate).map((vertex) => vertex.y)
    );

    const index = sourceVertices.findIndex(
      (vertex) => vertex.x === maxRightCoordinate && vertex.y === maxBottomCoordinate
    );

    sourceVertices = sourceVertices.slice(index).concat(sourceVertices.slice(0, index));

    this.style.clipPath = verticesToPolygon(sourceVertices.concat(targetVertices));
  }
}

// The order that vertices are returned is significant
function computeInlineVertices(rects: DOMRect[]): Vertex[] {
  rects = rects.map((rect) =>
    DOMRectReadOnly.fromRect({
      height: Math.round(rect.height),
      width: Math.round(rect.width),
      x: Math.round(rect.x),
      y: Math.round(rect.y),
    })
  );

  if (rects.length === 0) return [];
  else if (rects.length === 1) {
    const rect = rects[0];
    return [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.right, y: rect.bottom },
      { x: rect.left, y: rect.bottom },
    ];
  }

  const vertices: Vertex[] = [];

  if (rects[1].left < rects[0].left) {
    vertices.push({ x: rects[1].left, y: rects[1].top }, { x: rects[0].left, y: rects[0].bottom });
  }

  vertices.push({ x: rects[0].left, y: rects[0].top }, { x: rects[0].right, y: rects[0].top });

  const maxRightCoordinate = Math.max.apply(
    null,
    rects.map((rect) => rect.right)
  );
  const maxBottomCoordinate = Math.max.apply(
    null,
    rects.filter((rect) => rect.right === maxRightCoordinate).map((rect) => rect.bottom)
  );

  vertices.push({
    x: maxRightCoordinate,
    y: maxBottomCoordinate,
  });

  const lastRect = rects.at(-1)!;

  if (lastRect.bottom > maxBottomCoordinate) {
    vertices.push(
      { x: lastRect.right, y: lastRect.top },
      { x: lastRect.right, y: lastRect.bottom }
    );
  }

  vertices.push({ x: lastRect.left, y: lastRect.bottom });

  return vertices;
}
