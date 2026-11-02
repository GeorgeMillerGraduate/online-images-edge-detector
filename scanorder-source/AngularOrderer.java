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
public class AngularOrderer implements Orderer {

    /**
     * Number of bands.
     */
    private final int bands;

    /**
     * Create new instance of AngularScrambler.
     *
     * @param bands Number of bands.
     */
    public AngularOrderer(int bands) {
        this.bands = bands;
    }
    
    @Override
    public List<SortablePixel> getOrder(int width, int height) {
        List<SortablePixel> pixels = new ArrayList<>();
        
        for(int y = 0; y < height; y++) {
            double dy = y - (height * 0.5);
            for(int x = 0; x < width; x++) {                
                double dx = x - (width * 0.5);

                double a = StrictMath.abs((StrictMath.atan2(dy, -dx)
                        / (2 * StrictMath.PI) + 0.5) * bands % 1 - 0.5);
                
                SortablePixel pixel = new SortablePixel(x, y, a);
                pixels.add(pixel);
            } //f
        } //f
        
        Collections.sort(pixels);
        return pixels;
    }

}
