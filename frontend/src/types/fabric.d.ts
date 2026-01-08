/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * @file fabric.d.ts
 * @description Type declarations for Fabric.js library. */

declare namespace fabric {
  // Core Canvas class
  class Canvas {
    constructor(element: HTMLCanvasElement | string, options?: CanvasOptions);
    isDrawingMode: boolean;
    backgroundColor: string;
    width: number;
    height: number;
    freeDrawingBrush: any;
    dispose(): void;
    renderAll(): void;
    add(...objects: Object[]): Canvas;
    remove(...objects: Object[]): Canvas;
    getObjects(): Object[];
    clear(): Canvas;
    setWidth(width: number): Canvas;
    setHeight(height: number): Canvas;
    setBackgroundColor(color: string | Pattern, callback?: Function): Canvas;
    setViewportTransform(vpt: number[]): Canvas;
    toDataURL(options?: IDataURLOptions): string;
    on(event: string, handler: Function): Canvas;
    off(event: string, handler?: Function): Canvas;
  }

  // Basic Object class which other classes inherit from
  class Object {
    visible: boolean;
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    opacity: number;
    angle: number;
    setCoords(): Object;
    set(key: string | object, value?: any): Object;
    get(key: string): any;
    remove(): Object;
  }

  // Path class for free drawing
  class Path extends Object {
    constructor(pathData: string | object[], options?: PathOptions);
    path: any[];
  }

  // Simple shapes
  class Rect extends Object {
    constructor(options?: RectOptions);
    rx: number;
    ry: number;
  }

  class Circle extends Object {
    constructor(options?: CircleOptions);
    radius: number;
  }

  class Line extends Object {
    constructor(points: number[], options?: LineOptions);
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  class Text extends Object {
    constructor(text: string, options?: TextOptions);
    text: string;
    fontSize: number;
    fontFamily: string;
  }

  // Interfaces
  interface CanvasOptions {
    isDrawingMode?: boolean;
    backgroundColor?: string;
    width?: number;
    height?: number;
    selection?: boolean;
  }

  interface IDataURLOptions {
    format?: string;
    quality?: number;
    multiplier?: number;
  }

  interface PathOptions {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    selectable?: boolean;
  }

  interface RectOptions {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rx?: number;
    ry?: number;
  }

  interface CircleOptions {
    left?: number;
    top?: number;
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }

  interface LineOptions {
    stroke?: string;
    strokeWidth?: number;
    selectable?: boolean;
  }

  interface TextOptions {
    left?: number;
    top?: number;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
  }

  class Pattern {
    constructor(pattern: HTMLImageElement, repeat: string);
  }
}

declare module 'fabric' {
  export const fabric: typeof fabric;
}
