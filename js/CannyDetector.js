class CannyDetector {

    constructor(
        lowThreshold = 50,
        highThreshold = 120,
        blurRadius = 1
    ) {

        this.lowThreshold = lowThreshold;
        this.highThreshold = highThreshold;
        this.blurRadius = blurRadius;
    }


    /* =====================================================
       MAIN DETECTION METHOD
       ===================================================== */

    detect(imageData) {

        const width = imageData.width;
        const height = imageData.height;

        /*
         * 1. Convert the source image to greyscale.
         */
        let grey =
            this.toGreyscale(
                imageData
            );


        /*
         * 2. Smooth the image to reduce noise.
         */
        if (this.blurRadius > 0) {

            grey =
                this.gaussianBlur(
                    grey,
                    width,
                    height,
                    this.blurRadius
                );
        }


        /*
         * 3. Calculate Sobel gradient magnitude
         *    and gradient direction.
         */
        const gradient =
            this.calculateGradients(
                grey,
                width,
                height
            );


        /*
         * 4. Thin the edges.
         */
        const suppressed =
            this.nonMaximumSuppression(
                gradient.magnitude,
                gradient.direction,
                width,
                height
            );


        /*
         * 5. Separate strong, weak and rejected edges.
         */
        const thresholded =
            this.doubleThreshold(
                suppressed,
                width,
                height
            );


        /*
         * 6. Keep weak edges connected to strong edges.
         */
        const edges =
            this.hysteresis(
                thresholded,
                width,
                height
            );


        /*
         * Convert the final single-channel edge map
         * back into browser ImageData.
         */
        return this.toImageData(
            edges,
            width,
            height
        );
    }


    /* =====================================================
       GREYSCALE
       ===================================================== */

    toGreyscale(imageData) {

        const source =
            imageData.data;

        const grey =
            new Float32Array(
                imageData.width *
                imageData.height
            );


        let pixelIndex = 0;


        for (
            let i = 0;
            i < source.length;
            i += 4
        ) {

            const red =
                source[i];

            const green =
                source[i + 1];

            const blue =
                source[i + 2];


            /*
             * Standard luminance approximation.
             */
            grey[pixelIndex] =
                red * 0.299 +
                green * 0.587 +
                blue * 0.114;


            pixelIndex++;
        }


        return grey;
    }


    /* =====================================================
       GAUSSIAN BLUR
       ===================================================== */

    gaussianBlur(
        pixels,
        width,
        height,
        radius
    ) {

        radius =
            Math.max(
                0,
                Math.floor(radius)
            );


        if (radius === 0) {

            return new Float32Array(
                pixels
            );
        }


        /*
         * Sigma controls how strongly neighbouring
         * pixels influence one another.
         */
        const sigma =
            Math.max(
                0.8,
                radius
            );


        const kernel =
            this.createGaussianKernel(
                radius,
                sigma
            );


        /*
         * Gaussian convolution is separable.
         *
         * Instead of performing a full 2D convolution,
         * process horizontally and then vertically.
         *
         * This is considerably faster for large images.
         */

        const horizontal =
            new Float32Array(
                width * height
            );

        const output =
            new Float32Array(
                width * height
            );


        /* ---------------------------------------------
           HORIZONTAL PASS
           --------------------------------------------- */

        for (
            let y = 0;
            y < height;
            y++
        ) {

            for (
                let x = 0;
                x < width;
                x++
            ) {

                let total = 0;


                for (
                    let k = -radius;
                    k <= radius;
                    k++
                ) {

                    const sampleX =
                        this.clamp(
                            x + k,
                            0,
                            width - 1
                        );


                    total +=
                        pixels[
                            y * width +
                            sampleX
                        ] *
                        kernel[
                            k + radius
                        ];
                }


                horizontal[
                    y * width + x
                ] = total;
            }
        }


        /* ---------------------------------------------
           VERTICAL PASS
           --------------------------------------------- */

        for (
            let y = 0;
            y < height;
            y++
        ) {

            for (
                let x = 0;
                x < width;
                x++
            ) {

                let total = 0;


                for (
                    let k = -radius;
                    k <= radius;
                    k++
                ) {

                    const sampleY =
                        this.clamp(
                            y + k,
                            0,
                            height - 1
                        );


                    total +=
                        horizontal[
                            sampleY * width +
                            x
                        ] *
                        kernel[
                            k + radius
                        ];
                }


                output[
                    y * width + x
                ] = total;
            }
        }


        return output;
    }


    /* =====================================================
       CREATE GAUSSIAN KERNEL
       ===================================================== */

    createGaussianKernel(
        radius,
        sigma
    ) {

        const size =
            radius * 2 + 1;


        const kernel =
            new Float32Array(
                size
            );


        let total = 0;


        for (
            let i = -radius;
            i <= radius;
            i++
        ) {

            const value =
                Math.exp(
                    -(i * i) /
                    (
                        2 *
                        sigma *
                        sigma
                    )
                );


            kernel[
                i + radius
            ] = value;


            total += value;
        }


        /*
         * Normalise so all values add up to 1.
         */

        for (
            let i = 0;
            i < kernel.length;
            i++
        ) {

            kernel[i] /= total;
        }


        return kernel;
    }


    /* =====================================================
       SOBEL GRADIENT
       ===================================================== */

    calculateGradients(
        pixels,
        width,
        height
    ) {

        const magnitude =
            new Float32Array(
                width * height
            );


        const direction =
            new Float32Array(
                width * height
            );


        /*
         * Sobel kernels:
         *
         * Gx
         *
         * -1  0  1
         * -2  0  2
         * -1  0  1
         *
         *
         * Gy
         *
         * -1 -2 -1
         *  0  0  0
         *  1  2  1
         */


        for (
            let y = 1;
            y < height - 1;
            y++
        ) {

            for (
                let x = 1;
                x < width - 1;
                x++
            ) {

                const topLeft =
                    pixels[
                        (y - 1) * width +
                        (x - 1)
                    ];

                const top =
                    pixels[
                        (y - 1) * width +
                        x
                    ];

                const topRight =
                    pixels[
                        (y - 1) * width +
                        (x + 1)
                    ];


                const left =
                    pixels[
                        y * width +
                        (x - 1)
                    ];

                const right =
                    pixels[
                        y * width +
                        (x + 1)
                    ];


                const bottomLeft =
                    pixels[
                        (y + 1) * width +
                        (x - 1)
                    ];

                const bottom =
                    pixels[
                        (y + 1) * width +
                        x
                    ];

                const bottomRight =
                    pixels[
                        (y + 1) * width +
                        (x + 1)
                    ];


                const gx =
                    -topLeft +
                    topRight -
                    2 * left +
                    2 * right -
                    bottomLeft +
                    bottomRight;


                const gy =
                    -topLeft -
                    2 * top -
                    topRight +
                    bottomLeft +
                    2 * bottom +
                    bottomRight;


                const index =
                    y * width + x;


                magnitude[index] =
                    Math.sqrt(
                        gx * gx +
                        gy * gy
                    );


                direction[index] =
                    Math.atan2(
                        gy,
                        gx
                    );
            }
        }


        return {
            magnitude: magnitude,
            direction: direction
        };
    }


    /* =====================================================
       NON-MAXIMUM SUPPRESSION
       ===================================================== */

    nonMaximumSuppression(
        magnitude,
        direction,
        width,
        height
    ) {

        const output =
            new Float32Array(
                width * height
            );


        for (
            let y = 1;
            y < height - 1;
            y++
        ) {

            for (
                let x = 1;
                x < width - 1;
                x++
            ) {

                const index =
                    y * width + x;


                /*
                 * Convert radians to degrees.
                 */

                let angle =
                    direction[index] *
                    180 /
                    Math.PI;


                if (angle < 0) {

                    angle += 180;
                }


                let neighbour1 = 0;
                let neighbour2 = 0;


                /*
                 * Reduce gradient direction to one
                 * of four principal directions.
                 */


                /* -----------------------------------------
                   0 DEGREES
                   ----------------------------------------- */

                if (
                    angle < 22.5 ||
                    angle >= 157.5
                ) {

                    neighbour1 =
                        magnitude[
                            index - 1
                        ];

                    neighbour2 =
                        magnitude[
                            index + 1
                        ];
                }


                /* -----------------------------------------
                   45 DEGREES
                   ----------------------------------------- */

                else if (
                    angle < 67.5
                ) {

                    neighbour1 =
                        magnitude[
                            index -
                            width +
                            1
                        ];

                    neighbour2 =
                        magnitude[
                            index +
                            width -
                            1
                        ];
                }


                /* -----------------------------------------
                   90 DEGREES
                   ----------------------------------------- */

                else if (
                    angle < 112.5
                ) {

                    neighbour1 =
                        magnitude[
                            index -
                            width
                        ];

                    neighbour2 =
                        magnitude[
                            index +
                            width
                        ];
                }


                /* -----------------------------------------
                   135 DEGREES
                   ----------------------------------------- */

                else {

                    neighbour1 =
                        magnitude[
                            index -
                            width -
                            1
                        ];

                    neighbour2 =
                        magnitude[
                            index +
                            width +
                            1
                        ];
                }


                /*
                 * Keep only local maxima.
                 */

                if (
                    magnitude[index] >= neighbour1 &&
                    magnitude[index] >= neighbour2
                ) {

                    output[index] =
                        magnitude[index];

                } else {

                    output[index] = 0;
                }
            }
        }


        return output;
    }


    /* =====================================================
       DOUBLE THRESHOLD
       ===================================================== */

    doubleThreshold(
        pixels,
        width,
        height
    ) {

        const output =
            new Uint8Array(
                width * height
            );


        /*
         * Internal representation:
         *
         * 0   = rejected
         * 75  = weak edge
         * 255 = strong edge
         */

        const WEAK =
            75;

        const STRONG =
            255;


        for (
            let i = 0;
            i < pixels.length;
            i++
        ) {

            const value =
                pixels[i];


            if (
                value >=
                this.highThreshold
            ) {

                output[i] =
                    STRONG;
            }

            else if (
                value >=
                this.lowThreshold
            ) {

                output[i] =
                    WEAK;
            }

            else {

                output[i] =
                    0;
            }
        }


        return output;
    }


    /* =====================================================
       HYSTERESIS
       ===================================================== */

    hysteresis(
        pixels,
        width,
        height
    ) {

        const WEAK =
            75;

        const STRONG =
            255;


        /*
         * Copy the thresholded image because we
         * modify it during edge tracking.
         */

        const output =
            new Uint8Array(
                pixels
            );


        /*
         * Store strong pixels in a stack.
         *
         * From each strong edge we search neighbouring
         * pixels. Connected weak pixels become strong.
         */

        const stack = [];


        for (
            let y = 1;
            y < height - 1;
            y++
        ) {

            for (
                let x = 1;
                x < width - 1;
                x++
            ) {

                const index =
                    y * width + x;


                if (
                    output[index] ===
                    STRONG
                ) {

                    stack.push(
                        index
                    );
                }
            }
        }


        /*
         * Flood-fill through connected weak edges.
         */

        while (
            stack.length > 0
        ) {

            const index =
                stack.pop();


            const x =
                index % width;

            const y =
                Math.floor(
                    index / width
                );


            for (
                let offsetY = -1;
                offsetY <= 1;
                offsetY++
            ) {

                for (
                    let offsetX = -1;
                    offsetX <= 1;
                    offsetX++
                ) {

                    if (
                        offsetX === 0 &&
                        offsetY === 0
                    ) {

                        continue;
                    }


                    const neighbourX =
                        x + offsetX;

                    const neighbourY =
                        y + offsetY;


                    if (
                        neighbourX < 0 ||
                        neighbourX >= width ||
                        neighbourY < 0 ||
                        neighbourY >= height
                    ) {

                        continue;
                    }


                    const neighbourIndex =
                        neighbourY *
                        width +
                        neighbourX;


                    if (
                        output[
                            neighbourIndex
                        ] === WEAK
                    ) {

                        /*
                         * Promote the weak pixel to strong.
                         */

                        output[
                            neighbourIndex
                        ] = STRONG;


                        /*
                         * Search outward from this newly
                         * promoted edge as well.
                         */

                        stack.push(
                            neighbourIndex
                        );
                    }
                }
            }
        }


        /*
         * Any weak pixels that were not connected
         * to strong edges are discarded.
         */

        for (
            let i = 0;
            i < output.length;
            i++
        ) {

            if (
                output[i] !==
                STRONG
            ) {

                output[i] = 0;
            }
        }


        return output;
    }


    /* =====================================================
       CONVERT EDGE MAP TO IMAGE DATA
       ===================================================== */

    toImageData(
        edges,
        width,
        height
    ) {

        const imageData =
            new ImageData(
                width,
                height
            );


        const data =
            imageData.data;


        for (
            let i = 0;
            i < edges.length;
            i++
        ) {

            const value =
                edges[i];


            const offset =
                i * 4;


            data[offset] =
                value;

            data[offset + 1] =
                value;

            data[offset + 2] =
                value;

            data[offset + 3] =
                255;
        }


        return imageData;
    }


    /* =====================================================
       SETTINGS
       ===================================================== */

    setLowThreshold(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return;
        }


        this.lowThreshold =
            this.clamp(
                value,
                0,
                255
            );


        /*
         * Low threshold should never exceed high.
         */

        if (
            this.lowThreshold >
            this.highThreshold
        ) {

            this.lowThreshold =
                this.highThreshold;
        }
    }


    setHighThreshold(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return;
        }


        this.highThreshold =
            this.clamp(
                value,
                0,
                255
            );


        /*
         * High threshold should never be lower
         * than the low threshold.
         */

        if (
            this.highThreshold <
            this.lowThreshold
        ) {

            this.highThreshold =
                this.lowThreshold;
        }
    }


    setBlurRadius(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return;
        }


        this.blurRadius =
            this.clamp(
                Math.round(value),
                0,
                10
            );
    }


    /* =====================================================
       GETTERS
       ===================================================== */

    getLowThreshold() {

        return this.lowThreshold;
    }


    getHighThreshold() {

        return this.highThreshold;
    }


    getBlurRadius() {

        return this.blurRadius;
    }


    /* =====================================================
       UTILITY
       ===================================================== */

    clamp(
        value,
        minimum,
        maximum
    ) {

        return Math.max(
            minimum,
            Math.min(
                maximum,
                value
            )
        );
    }
}