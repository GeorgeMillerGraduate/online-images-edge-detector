class SobelDetector {

    constructor(
        threshold = 128
    ) {

        this.threshold =
            threshold;
    }


    /* =====================================================
       MAIN DETECTION METHOD
       ===================================================== */

    detect(imageData) {

        if (!imageData) {

            throw new Error(
                "ImageData is required."
            );
        }


        const width =
            imageData.width;


        const height =
            imageData.height;


        /*
         * 1. Convert the source image to greyscale.
         */

        const grey =
            ImageProcessor.toGreyscale(
                imageData
            );


        /*
         * 2. Calculate horizontal and vertical
         *    Sobel gradients.
         */

        const gradients =
            ImageProcessor.sobel(
                grey,
                width,
                height
            );


        /*
         * 3. Convert the gradient magnitude into
         *    a visible edge map.
         */

        return this.createEdgeMap(
            gradients.magnitude,
            width,
            height
        );
    }


    /* =====================================================
       CREATE EDGE MAP
       ===================================================== */

    createEdgeMap(
        magnitude,
        width,
        height
    ) {

        const output =
            new Uint8ClampedArray(
                width * height
            );


        for (
            let i = 0;
            i < magnitude.length;
            i++
        ) {

            const value =
                magnitude[i];


            /*
             * Pixels below the selected threshold
             * are discarded.
             *
             * Stronger gradients remain visible.
             */

            if (
                value >=
                this.threshold
            ) {

                output[i] =
                    Math.min(
                        255,
                        Math.round(value)
                    );

            } else {

                output[i] =
                    0;
            }
        }


        return ImageProcessor.arrayToImageData(
            output,
            width,
            height
        );
    }


    /* =====================================================
       RAW SOBEL
       ===================================================== */

    detectRaw(imageData) {

        if (!imageData) {

            throw new Error(
                "ImageData is required."
            );
        }


        const grey =
            ImageProcessor.toGreyscale(
                imageData
            );


        return ImageProcessor.sobel(
            grey,
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       MAGNITUDE IMAGE
       ===================================================== */

    detectMagnitude(imageData) {

        const gradients =
            this.detectRaw(
                imageData
            );


        /*
         * Normalise the complete gradient range.
         *
         * Unlike detect(), this does not apply the
         * threshold. It is useful for displaying the
         * raw Sobel response.
         */

        const normalised =
            ImageProcessor.normalize(
                gradients.magnitude,
                0,
                255
            );


        return ImageProcessor.arrayToImageData(
            normalised,
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       HORIZONTAL EDGES
       ===================================================== */

    detectHorizontal(imageData) {

        const gradients =
            this.detectRaw(
                imageData
            );


        const values =
            new Float32Array(
                gradients.x.length
            );


        for (
            let i = 0;
            i < values.length;
            i++
        ) {

            values[i] =
                Math.abs(
                    gradients.x[i]
                );
        }


        const normalised =
            ImageProcessor.normalize(
                values,
                0,
                255
            );


        return ImageProcessor.arrayToImageData(
            normalised,
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       VERTICAL EDGES
       ===================================================== */

    detectVertical(imageData) {

        const gradients =
            this.detectRaw(
                imageData
            );


        const values =
            new Float32Array(
                gradients.y.length
            );


        for (
            let i = 0;
            i < values.length;
            i++
        ) {

            values[i] =
                Math.abs(
                    gradients.y[i]
                );
        }


        const normalised =
            ImageProcessor.normalize(
                values,
                0,
                255
            );


        return ImageProcessor.arrayToImageData(
            normalised,
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       BINARY EDGE MAP
       ===================================================== */

    detectBinary(imageData) {

        const gradients =
            this.detectRaw(
                imageData
            );


        const output =
            new Uint8Array(
                gradients.magnitude.length
            );


        for (
            let i = 0;
            i < gradients.magnitude.length;
            i++
        ) {

            output[i] =
                gradients.magnitude[i] >=
                this.threshold
                    ? 1
                    : 0;
        }


        return ImageProcessor.binaryToImageData(
            output,
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       SET THRESHOLD
       ===================================================== */

    setThreshold(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return;
        }


        this.threshold =
            ImageProcessor.clamp(
                value,
                0,
                255
            );
    }


    /* =====================================================
       GET THRESHOLD
       ===================================================== */

    getThreshold() {

        return this.threshold;
    }
}