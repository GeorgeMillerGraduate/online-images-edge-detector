package com.scanorder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
public class SquareSpiralOrderer implements Orderer {

    @Override
    public List<SortablePixel> getOrder(int width, int height) {
        List<SortablePixel> pixels = new ArrayList<>();

        double priority;
        for (int y = 0; y < height; y++) {
            int dy = y - (height >> 1);
            for (int x = 0; x < width; x++) {
                int dx = x - (width >> 1);

                //North triangle
                if (dx > dy && dx < -dy) {
                    priority = (4 * dy * dy) + (7 * dy) + 3 + dx;
                    SortablePixel pixel = new SortablePixel(x, y, priority);
                    pixels.add(pixel);
                    continue;
                } //i

                //East triangle
                if (dx > dy && dx >= -dy) {
                    priority = (4 * dx * dx) + (3 * dx) + 1 + dy;
                    SortablePixel pixel = new SortablePixel(x, y, priority);
                    pixels.add(pixel);
                    continue;
                } //i

                //West triangle
                if (dx < -dy) {
                    priority = (4 * dx * dx) + dx - 1 - dy;
                    SortablePixel pixel = new SortablePixel(x, y, priority);
                    pixels.add(pixel);
                    continue;
                } //i

                //South triangle
                priority = (4 * dy * dy) + (5 * dy) + 1 - dx;
                SortablePixel pixel = new SortablePixel(x, y, priority);
                pixels.add(pixel);
            } //f
        } //f

        Collections.sort(pixels);
        return pixels;
    }

}
