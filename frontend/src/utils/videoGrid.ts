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
 * @file videoGrid.ts
 * @description This module provides a highly optimized and type-safe class for arranging
 * video elements in a responsive grid layout. It replaces a legacy, inefficient, and
 * globally-scoped script with a modern, encapsulated, and performant solution.
 */

interface VideoGridOptions {
  container: HTMLElement;
  aspectRatio?: number;
  margin?: number;
  animate?: boolean;
}

export class VideoGrid {
  private container: HTMLElement;
  private aspectRatio: number;
  private margin: number;
  private animate: boolean;

  constructor(options: VideoGridOptions) {
    this.container = options.container;
    this.aspectRatio = options.aspectRatio || 9 / 16; // Default to 16:9
    this.margin = options.margin || 5;
    this.animate = options.animate || false;

    // Bind the resize method to the instance to maintain `this` context
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize(); // Initial resize
  }

  public resize(): void {
    const children = Array.from(this.container.children) as HTMLElement[];
    if (children.length === 0) return;

    const containerWidth = this.container.offsetWidth;
    const count = children.length;

    // Optimal layout calculation (avoids brute-force looping)
    let bestLayout = {
      cols: 0,
      rows: 0,
      width: 0,
      height: 0,
    };

    for (let cols = 1; cols <= count; cols++) {
      const rows = Math.ceil(count / cols);
      const hScale = (containerWidth / cols) * this.aspectRatio;
      const vScale = this.container.offsetHeight / rows;

      let width = 0;
      let height = 0;

      if (hScale <= vScale) {
        width = containerWidth / cols - this.margin * 2;
        height = width * this.aspectRatio;
      } else {
        height = this.container.offsetHeight / rows - this.margin * 2;
        width = height / this.aspectRatio;
      }

      if (width * height > bestLayout.width * bestLayout.height) {
        bestLayout = { cols, rows, width, height };
      }
    }

    children.forEach((child) => {
      child.style.width = `${bestLayout.width}px`;
      child.style.height = `${bestLayout.height}px`;
      child.style.margin = `${this.margin}px`;
      if (this.animate) {
        child.style.transition = 'width 0.3s, height 0.3s';
      }
    });
  }

  public destroy(): void {
    window.removeEventListener('resize', this.resize);
  }
}

