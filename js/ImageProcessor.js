class ImageProcessor {

    /* =====================================================
       GREYSCALE CONVERSION
       ===================================================== */

    static toGreyscale(imageData) {

        if (!imageData) {

            throw new Error(
                "ImageData is required."
            );
        }


        const source =
            imageData.data;


        const pixelCount =
            imageData.width *
            imageData.height;


        const grey =
            new Float32Array(
                pixelCount
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
             * Luminance conversion.
             *
             * Human vision is more sensitive to green
             * than red or blue, so the channels are
             * deliberately weighted differently.
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
       GREYSCALE IMAGE DATA
       ===================================================== */

    static toGreyscaleImageData(
        imageData
    ) {

        const grey =
            this.toGreyscale(
                imageData
            );


        return this.arrayToImageData(
            grey,
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       CLONE IMAGE DATA
       ===================================================== */

    static cloneImageData(
        imageData
    ) {

        if (!imageData) {

            return null;
        }


        return new ImageData(
            new Uint8ClampedArray(
                imageData.data
            ),
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       CONVOLUTION
       ===================================================== */

    static convolve(
        pixels,
        width,
        height,
        kernel,
        kernelWidth = null,
        kernelHeight = null
    ) {

        if (!pixels) {

            throw new Error(
                "Pixel data is required."
            );
        }


        /*
         * If no dimensions are supplied, assume
         * the kernel is square.
         */

        if (
            kernelWidth === null ||
            kernelHeight === null
        ) {

            const size =
                Math.sqrt(
                    kernel.length
                );


            if (
                !Number.isInteger(size)
            ) {

                throw new Error(
                    "Kernel dimensions could not be determined."
                );
            }


            kernelWidth =
                size;

            kernelHeight =
                size;
        }


        const output =
            new Float32Array(
                width * height
            );


        const halfWidth =
            Math.floor(
                kernelWidth / 2
            );


        const halfHeight =
            Math.floor(
                kernelHeight / 2
            );


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
                    let kernelY = 0;
                    kernelY < kernelHeight;
                    kernelY++
                ) {

                    for (
                        let kernelX = 0;
                        kernelX < kernelWidth;
                        kernelX++
                    ) {

                        /*
                         * Clamp coordinates at image
                         * boundaries.
                         *
                         * This effectively extends the
                         * nearest edge pixel.
                         */

                        const imageX =
                            this.clamp(
                                x +
                                kernelX -
                                halfWidth,
                                0,
                                width - 1
                            );


                        const imageY =
                            this.clamp(
                                y +
                                kernelY -
                                halfHeight,
                                0,
                                height - 1
                            );


                        const imageIndex =
                            imageY *
                            width +
                            imageX;


                        const kernelIndex =
                            kernelY *
                            kernelWidth +
                            kernelX;


                        total +=
                            pixels[
                                imageIndex
                            ] *
                            kernel[
                                kernelIndex
                            ];
                    }
                }


                output[
                    y * width + x
                ] = total;
            }
        }


        return output;
    }


    /* =====================================================
       GAUSSIAN BLUR
       ===================================================== */

    static gaussianBlur(
        pixels,
        width,
        height,
        radius = 1
    ) {

        radius =
            Math.max(
                0,
                Math.round(radius)
            );


        if (radius === 0) {

            return new Float32Array(
                pixels
            );
        }


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
         * Gaussian blur is separable.
         *
         * A horizontal pass followed by a vertical
         * pass produces the same result as a full
         * 2D Gaussian convolution but is much faster.
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
           HORIZONTAL
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
                    let offset = -radius;
                    offset <= radius;
                    offset++
                ) {

                    const sampleX =
                        this.clamp(
                            x + offset,
                            0,
                            width - 1
                        );


                    total +=
                        pixels[
                            y * width +
                            sampleX
                        ] *
                        kernel[
                            offset + radius
                        ];
                }


                horizontal[
                    y * width + x
                ] = total;
            }
        }


        /* ---------------------------------------------
           VERTICAL
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
                    let offset = -radius;
                    offset <= radius;
                    offset++
                ) {

                    const sampleY =
                        this.clamp(
                            y + offset,
                            0,
                            height - 1
                        );


                    total +=
                        horizontal[
                            sampleY *
                            width +
                            x
                        ] *
                        kernel[
                            offset + radius
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
       CREATE 1D GAUSSIAN KERNEL
       ===================================================== */

    static createGaussianKernel(
        radius,
        sigma = null
    ) {

        radius =
            Math.max(
                0,
                Math.round(radius)
            );


        if (radius === 0) {

            return new Float32Array(
                [1]
            );
        }


        if (
            sigma === null ||
            sigma <= 0
        ) {

            sigma =
                Math.max(
                    0.8,
                    radius
                );
        }


        const size =
            radius * 2 + 1;


        const kernel =
            new Float32Array(
                size
            );


        let total =
            0;


        for (
            let x = -radius;
            x <= radius;
            x++
        ) {

            const value =
                Math.exp(
                    -(x * x) /
                    (
                        2 *
                        sigma *
                        sigma
                    )
                );


            kernel[
                x + radius
            ] = value;


            total +=
                value;
        }


        /*
         * Normalise the kernel so its values
         * sum to exactly 1.
         */

        for (
            let i = 0;
            i < kernel.length;
            i++
        ) {

            kernel[i] /=
                total;
        }


        return kernel;
    }


    /* =====================================================
       NORMALISE ARRAY
       ===================================================== */

    static normalize(
        pixels,
        minimum = 0,
        maximum = 255
    ) {

        if (
            !pixels ||
            pixels.length === 0
        ) {

            return new Float32Array();
        }


        let sourceMinimum =
            Infinity;


        let sourceMaximum =
            -Infinity;


        for (
            let i = 0;
            i < pixels.length;
            i++
        ) {

            const value =
                pixels[i];


            if (
                value <
                sourceMinimum
            ) {

                sourceMinimum =
                    value;
            }


            if (
                value >
                sourceMaximum
            ) {

                sourceMaximum =
                    value;
            }
        }


        const output =
            new Float32Array(
                pixels.length
            );


        const range =
            sourceMaximum -
            sourceMinimum;


        if (range === 0) {

            output.fill(
                minimum
            );

            return output;
        }


        const destinationRange =
            maximum -
            minimum;


        for (
            let i = 0;
            i < pixels.length;
            i++
        ) {

            output[i] =
                (
                    (
                        pixels[i] -
                        sourceMinimum
                    ) /
                    range
                ) *
                destinationRange +
                minimum;
        }


        return output;
    }


    /* =====================================================
       ARRAY TO IMAGE DATA
       ===================================================== */

    static arrayToImageData(
        pixels,
        width,
        height
    ) {

        const imageData =
            new ImageData(
                width,
                height
            );


        const output =
            imageData.data;


        for (
            let i = 0;
            i < pixels.length;
            i++
        ) {

            const value =
                this.clamp(
                    Math.round(
                        pixels[i]
                    ),
                    0,
                    255
                );


            const offset =
                i * 4;


            output[offset] =
                value;

            output[offset + 1] =
                value;

            output[offset + 2] =
                value;

            output[offset + 3] =
                255;
        }


        return imageData;
    }


    /* =====================================================
       BINARY ARRAY TO IMAGE DATA
       ===================================================== */

    static binaryToImageData(
        pixels,
        width,
        height,
        invert = false
    ) {

        const imageData =
            new ImageData(
                width,
                height
            );


        const output =
            imageData.data;


        for (
            let i = 0;
            i < pixels.length;
            i++
        ) {

            let value =
                pixels[i] ?
                    255 :
                    0;


            if (invert) {

                value =
                    255 - value;
            }


            const offset =
                i * 4;


            output[offset] =
                value;

            output[offset + 1] =
                value;

            output[offset + 2] =
                value;

            output[offset + 3] =
                255;
        }


        return imageData;
    }


    /* =====================================================
       INVERT IMAGE DATA
       ===================================================== */

    static invertImageData(
        imageData
    ) {

        const output =
            this.cloneImageData(
                imageData
            );


        const data =
            output.data;


        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            data[i] =
                255 - data[i];

            data[i + 1] =
                255 - data[i + 1];

            data[i + 2] =
                255 - data[i + 2];

            /*
             * Alpha is deliberately left unchanged.
             */
        }


        return output;
    }


    /* =====================================================
       SOBEL GRADIENTS
       ===================================================== */

    static sobel(
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


        const gradientX =
            new Float32Array(
                width * height
            );


        const gradientY =
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

                const topLeft =
                    pixels[
                        (y - 1) *
                        width +
                        x - 1
                    ];


                const top =
                    pixels[
                        (y - 1) *
                        width +
                        x
                    ];


                const topRight =
                    pixels[
                        (y - 1) *
                        width +
                        x + 1
                    ];


                const left =
                    pixels[
                        y *
                        width +
                        x - 1
                    ];


                const right =
                    pixels[
                        y *
                        width +
                        x + 1
                    ];


                const bottomLeft =
                    pixels[
                        (y + 1) *
                        width +
                        x - 1
                    ];


                const bottom =
                    pixels[
                        (y + 1) *
                        width +
                        x
                    ];


                const bottomRight =
                    pixels[
                        (y + 1) *
                        width +
                        x + 1
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


                gradientX[index] =
                    gx;


                gradientY[index] =
                    gy;


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

            x: gradientX,

            y: gradientY,

            magnitude: magnitude,

            direction: direction

        };
    }


    /* =====================================================
       IMAGE DIMENSIONS
       ===================================================== */

    static getDimensions(
        imageData
    ) {

        if (!imageData) {

            return {
                width: 0,
                height: 0
            };
        }


        return {

            width:
                imageData.width,

            height:
                imageData.height

        };
    }


    /* =====================================================
       CLAMP
       ===================================================== */

    static clamp(
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