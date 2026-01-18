/**
 * Unit tests for common.js
 * Run with: node --test common.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  serializeCoord,
  parseCoord,
  serializePoint,
  parsePoint,
  serializeSegment,
  parseSegment,
  continuityToLetter,
  letterToContinuity,
  serializeCurve,
  parseCurve,
  serializeCurves,
  parseCurvesFromURL,
  debounce,
  deleteNodeFromCurves,
} from './common.js';

// ============================================================================
// Coordinate Serialization
// ============================================================================

describe('serializeCoord / parseCoord', () => {
  test('positive number', () => {
    assert.equal(serializeCoord(100), '100');
    assert.equal(parseCoord('100'), 100);
  });

  test('negative number uses n prefix', () => {
    assert.equal(serializeCoord(-50), 'n50');
    assert.equal(parseCoord('n50'), -50);
  });

  test('zero', () => {
    assert.equal(serializeCoord(0), '0');
    assert.equal(parseCoord('0'), 0);
  });

  test('decimal precision (1 decimal place)', () => {
    assert.equal(serializeCoord(123.456), '123.5');
    assert.equal(serializeCoord(-123.456), 'n123.5');
  });

  test('roundtrip', () => {
    const values = [0, 100, -50, 123.4, -0.5];
    for (const v of values) {
      const serialized = serializeCoord(v);
      const parsed = parseCoord(serialized);
      assert.equal(parsed, Math.round(v * 10) / 10);
    }
  });
});

// ============================================================================
// Point Serialization
// ============================================================================

describe('serializePoint / parsePoint', () => {
  test('basic point', () => {
    const point = { x: 100, y: 200 };
    assert.equal(serializePoint(point), '100~200');
  });

  test('point with negatives', () => {
    const point = { x: -50, y: -100 };
    assert.equal(serializePoint(point), 'n50~n100');
  });

  test('roundtrip', () => {
    const point = { x: 123.4, y: -567.8 };
    const parsed = parsePoint(serializePoint(point));
    assert.equal(parsed.x, 123.4);
    assert.equal(parsed.y, -567.8);
  });
});

// ============================================================================
// Segment Serialization
// ============================================================================

describe('serializeSegment / parseSegment', () => {
  test('basic segment', () => {
    const seg = {
      p0: { x: 0, y: 0 },
      p1: { x: 50, y: 100 },
      p2: { x: 150, y: 100 },
      p3: { x: 200, y: 0 },
    };
    const serialized = serializeSegment(seg);
    assert.equal(serialized, '0~0_50~100_150~100_200~0');
  });

  test('roundtrip', () => {
    const seg = {
      p0: { x: 10, y: 20 },
      p1: { x: 30, y: 40 },
      p2: { x: 50, y: 60 },
      p3: { x: 70, y: 80 },
    };
    const parsed = parseSegment(serializeSegment(seg));
    assert.deepEqual(parsed, seg);
  });
});

// ============================================================================
// Continuity Mode
// ============================================================================

describe('continuityToLetter / letterToContinuity', () => {
  test('c1 -> t', () => {
    assert.equal(continuityToLetter('c1'), 't');
    assert.equal(letterToContinuity('t'), 'c1');
  });

  test('c2 -> c', () => {
    assert.equal(continuityToLetter('c2'), 'c');
    assert.equal(letterToContinuity('c'), 'c2');
  });

  test('independent -> i', () => {
    assert.equal(continuityToLetter('independent'), 'i');
    assert.equal(letterToContinuity('i'), 'independent');
  });

  test('unknown defaults to independent', () => {
    assert.equal(continuityToLetter('unknown'), 'i');
    assert.equal(letterToContinuity('x'), 'independent');
  });
});

// ============================================================================
// Curve Serialization
// ============================================================================

describe('serializeCurve / parseCurve', () => {
  test('single segment curve', () => {
    const curve = {
      segments: [{
        p0: { x: 0, y: 0 },
        p1: { x: 50, y: 100 },
        p2: { x: 150, y: 100 },
        p3: { x: 200, y: 0 },
      }],
      continuity: [],
    };
    const serialized = serializeCurve(curve);
    assert.equal(serialized, '0~0_50~100_150~100_200~0');
    
    const parsed = parseCurve(serialized);
    assert.deepEqual(parsed, curve);
  });

  test('multi-segment curve with continuity', () => {
    const curve = {
      segments: [
        { p0: { x: 0, y: 0 }, p1: { x: 50, y: 50 }, p2: { x: 100, y: 50 }, p3: { x: 150, y: 0 } },
        { p0: { x: 150, y: 0 }, p1: { x: 200, y: -50 }, p2: { x: 250, y: -50 }, p3: { x: 300, y: 0 } },
      ],
      continuity: ['c1'],
    };
    const serialized = serializeCurve(curve);
    assert.ok(serialized.includes('-t')); // c1 -> t
    
    const parsed = parseCurve(serialized);
    assert.equal(parsed.segments.length, 2);
    assert.deepEqual(parsed.continuity, ['c1']);
  });
});

// ============================================================================
// Multiple Curves Serialization
// ============================================================================

describe('serializeCurves / parseCurvesFromURL', () => {
  test('empty array', () => {
    assert.equal(serializeCurves([]), '');
    assert.deepEqual(parseCurvesFromURL(''), []);
  });

  test('single curve', () => {
    const curves = [{
      segments: [{ p0: { x: 0, y: 0 }, p1: { x: 50, y: 50 }, p2: { x: 100, y: 50 }, p3: { x: 150, y: 0 } }],
      continuity: [],
    }];
    const serialized = serializeCurves(curves);
    const parsed = parseCurvesFromURL(serialized);
    assert.equal(parsed.length, 1);
  });

  test('multiple curves separated by !', () => {
    const curves = [
      { segments: [{ p0: { x: 0, y: 0 }, p1: { x: 50, y: 50 }, p2: { x: 100, y: 50 }, p3: { x: 150, y: 0 } }], continuity: [] },
      { segments: [{ p0: { x: 200, y: 200 }, p1: { x: 250, y: 250 }, p2: { x: 300, y: 250 }, p3: { x: 350, y: 200 } }], continuity: [] },
    ];
    const serialized = serializeCurves(curves);
    assert.ok(serialized.includes('!'));
    
    const parsed = parseCurvesFromURL(serialized);
    assert.equal(parsed.length, 2);
  });
});

// ============================================================================
// Debounce
// ============================================================================

describe('debounce', () => {
  test('returns a function', () => {
    const debounced = debounce(() => {}, 100);
    assert.equal(typeof debounced, 'function');
  });

  test('delays function execution', async () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debounced = debounce(fn, 50);
    
    debounced();
    debounced();
    debounced();
    
    // Not called yet
    assert.equal(callCount, 0);
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(callCount, 1);
  });

  test('calling debounced function returns undefined immediately', () => {
    const debounced = debounce(() => 42, 100);
    const result = debounced();
    assert.equal(result, undefined);
  });
});

// ============================================================================
// Delete Node From Curves
// ============================================================================

describe('deleteNodeFromCurves', () => {
  const makeCurve = (numSegments) => ({
    segments: Array.from({ length: numSegments }, (_, i) => ({
      p0: { x: i * 100, y: 0 },
      p1: { x: i * 100 + 25, y: 50 },
      p2: { x: i * 100 + 75, y: 50 },
      p3: { x: (i + 1) * 100, y: 0 },
    })),
    continuity: Array(Math.max(0, numSegments - 1)).fill('c1'),
  });

  test('only anchors (p0/p3) can be deleted', () => {
    const curves = [makeCurve(2)];
    const result = deleteNodeFromCurves(curves, 0, 0, 0, 'p1');
    assert.equal(result.curves.length, 1);
    assert.equal(result.curves[0].segments.length, 2); // unchanged
  });

  test('single segment curve - deletes entire curve', () => {
    const curves = [makeCurve(1)];
    const result = deleteNodeFromCurves(curves, 0, 0, 0, 'p0');
    assert.equal(result.curves.length, 0);
  });

  test('deleting first anchor (p0) removes first segment', () => {
    const curves = [makeCurve(3)];
    const result = deleteNodeFromCurves(curves, 0, 0, 0, 'p0');
    assert.equal(result.curves[0].segments.length, 2);
  });

  test('deleting last anchor (p3) removes last segment', () => {
    const curves = [makeCurve(3)];
    const result = deleteNodeFromCurves(curves, 0, 0, 2, 'p3');
    assert.equal(result.curves[0].segments.length, 2);
  });

  test('deleting middle anchor merges segments', () => {
    const curves = [makeCurve(3)];
    const result = deleteNodeFromCurves(curves, 0, 0, 0, 'p3');
    assert.equal(result.curves[0].segments.length, 2);
    // Merged segment should have p0 from first, p3 from second
    assert.deepEqual(result.curves[0].segments[0].p0, { x: 0, y: 0 });
  });

  test('does not mutate original curves', () => {
    const curves = [makeCurve(2)];
    const originalLength = curves[0].segments.length;
    deleteNodeFromCurves(curves, 0, 0, 0, 'p0');
    assert.equal(curves[0].segments.length, originalLength);
  });

  test('updates activeCurveIndex when deleting last curve', () => {
    const curves = [makeCurve(1)];
    const result = deleteNodeFromCurves(curves, 1, 0, 0, 'p0');
    assert.equal(result.activeCurveIndex, -1);
  });

  test('empty curves array returns unchanged', () => {
    const curves = [];
    const result = deleteNodeFromCurves(curves, 0, 0, 0, 'p0');
    assert.deepEqual(result.curves, []);
    assert.equal(result.activeCurveIndex, 0);
  });

  test('curve with zero segments returns unchanged', () => {
    // Edge case: a curve object with empty segments array
    const curves = [{ segments: [], continuity: [] }];
    const result = deleteNodeFromCurves(curves, 0, 0, 0, 'p0');
    assert.equal(result.curves.length, 1);
    assert.equal(result.curves[0].segments.length, 0);
  });

  test('invalid curve index returns unchanged', () => {
    const curves = [makeCurve(2)];
    const result = deleteNodeFromCurves(curves, 0, 5, 0, 'p0');
    assert.equal(result.curves.length, 1);
    assert.equal(result.curves[0].segments.length, 2);
  });

  test('negative curve index returns unchanged', () => {
    const curves = [makeCurve(2)];
    const result = deleteNodeFromCurves(curves, 0, -1, 0, 'p0');
    assert.equal(result.curves.length, 1);
    assert.equal(result.curves[0].segments.length, 2);
  });
});

