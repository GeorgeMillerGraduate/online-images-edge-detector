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
public class FlowerOrderer implements Orderer {
    
    /**
     * The number of petals in the flower pattern.
     */
    private int petals = 5;
    
    /**
     * The size of the petals in the flower pattern.
     */
    private double petalSize = 2;

    /**
     * Create new instance of FlowerOrderer.
     */
    public FlowerOrderer() {
    }

    /**
     * Create new instance of FlowerOrderer.
     * @param petals The number of petals in the flower pattern.
     * @param petalSize The size of the petals in the flower pattern.
     */
    public FlowerOrderer(int petals, double petalSize) {
        this.petals = petals;
        this.petalSize = petalSize;
    }

    @Override
    public List<SortablePixel> getOrder(int width, int height) {
        List<SortablePixel> pixels = new ArrayList<>();

        for (int y = 0; y < height; y++) {
            double dy = y - (height - 0.875) * 0.5;
            for (int x = 0; x < width; x++) {
                double dx = x - (width - 0.75) * 0.5;

                double a = StrictMath.atan2(dy, -dx) * petals;
                double r = StrictMath.sqrt(dx * dx + dy * dy);
                dx = r * (StrictMath.cos(a) + petalSize);

                //Add point   
                SortablePixel pixel = new SortablePixel(x, y, dx);
                pixels.add(pixel);
            } //f
        } //f

        Collections.sort(pixels);
        return pixels;
    }

}
