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
public class TriangleOrderer implements Orderer {

    @Override
    public List<SortablePixel> getOrder(int width, int height) {
        List<SortablePixel> pixels = new ArrayList<>();

        for (int y = 0; y < height; y++) {
            int dy = y - (height >> 1);
            int dy2 = StrictMath.abs(y - (height >> 1));
            for (int x = 0; x < width; x++) {
                int dx = x - (width >> 1);
                int dx2 = StrictMath.abs(x - (width >> 1));

                //North triangle
                if (dx > dy && dx < -dy) {
                    SortablePixel pixel = new SortablePixel(x, y, (dx2 ^ dy2) + 100000);
                    pixels.add(pixel);
                    continue;
                } //i

                //East triangle
                if (dx > dy && dx >= -dy) {
                    SortablePixel pixel = new SortablePixel(x, y, (dx2 ^ dy2) + 200000);
                    pixels.add(pixel);
                    continue;
                } //i

                //West triangle
                if (dx < -dy) {
                    SortablePixel pixel = new SortablePixel(x, y, (dx2 ^ dy2) + 400000);
                    pixels.add(pixel);
                    continue;
                } //i

                //South triangle
                SortablePixel pixel = new SortablePixel(x, y, (dx2 ^ dy2) + 300000);
                pixels.add(pixel);
            } //f
        } //f

        Collections.sort(pixels);
        return pixels;
    }

}
