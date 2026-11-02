package com.scanorder;

/*
 * Copyright © 2025 George Miller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
public class SortablePixel implements Comparable<SortablePixel> {

    /**
     * The x-coordinate of the pixel.
     */
    private final int x;

    /**
     * The y-coordinate of the pixel.
     */
    private final int y;

    /**
     * Determines the position of this Object in the Collection.
     */
    private final double priority;

    /**
     * Create new instance of SortablePixel.
     *
     * @param x X-coordinate of the Pixel.
     * @param y Y-coordinate of the Pixel.
     * @param priority The position of this pixel in the Collection.
     */
    public SortablePixel(int x, int y, double priority) {
        this.x = x;
        this.y = y;
        this.priority = priority;
    }
    
    /**
     * Get the x-coordinate.
     *
     * @return The x-coordinate.
     */
    public int getX() {
        return this.x;
    }

    /**
     * Get the y-coordinate.
     *
     * @return The y-coordinate.
     */
    public int getY() {
        return this.y;
    }


    /**
     * Get the priority of of this SortablePixel.
     *
     * @return The priority of this SortablePixel.
     */
    public double getPriority() {
        return priority;
    }

    @Override
    public int compareTo(SortablePixel o) {
        if (o.priority > this.priority) {
            return -1;
        } else if (o.priority < this.priority) {
            return 1;
        } else {
            return 0;
        } //iel
    }

    
}
