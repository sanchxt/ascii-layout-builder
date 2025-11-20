export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const snapPositionToGrid = (
  position: { x: number; y: number },
  gridSize: number
): { x: number; y: number } => {
  return {
    x: snapToGrid(position.x, gridSize),
    y: snapToGrid(position.y, gridSize),
  };
};

export const getBoundingBox = (
  boxes: Array<{ x: number; y: number; width: number; height: number }>
): {
  x: number;
  y: number;
  width: number;
  height: number;
} => {
  if (boxes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
};

export const getDistance = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isWithinThreshold = (
  value: number,
  target: number,
  threshold: number
): boolean => {
  return Math.abs(value - target) <= threshold;
};

export const getBoxCenter = (box: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: number; y: number } => {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
};

export const getBoxEdges = (box: {
  x: number;
  y: number;
  width: number;
  height: number;
}): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} => {
  return {
    left: box.x,
    right: box.x + box.width,
    top: box.y,
    bottom: box.y + box.height,
  };
};

export const doBoxesOverlap = (
  box1: { x: number; y: number; width: number; height: number },
  box2: { x: number; y: number; width: number; height: number }
): boolean => {
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
};

export const getNearestEdgeDistance = (
  box1: { x: number; y: number; width: number; height: number },
  box2: { x: number; y: number; width: number; height: number }
): {
  horizontal: number;
  vertical: number;
  nearest: number;
  direction: "horizontal" | "vertical";
} => {
  let horizontal = Infinity;
  if (box1.x + box1.width <= box2.x) {
    horizontal = box2.x - (box1.x + box1.width);
  } else if (box2.x + box2.width <= box1.x) {
    horizontal = box1.x - (box2.x + box2.width);
  }

  let vertical = Infinity;
  if (box1.y + box1.height <= box2.y) {
    vertical = box2.y - (box1.y + box1.height);
  } else if (box2.y + box2.height <= box1.y) {
    vertical = box1.y - (box2.y + box2.height);
  }

  const nearest = Math.min(horizontal, vertical);
  const direction = horizontal < vertical ? "horizontal" : "vertical";

  return {
    horizontal: horizontal === Infinity ? 0 : horizontal,
    vertical: vertical === Infinity ? 0 : vertical,
    nearest: nearest === Infinity ? 0 : nearest,
    direction,
  };
};
