class ThresholdDetector {

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
         * Convert the uploaded image to greyscale.
         */

        const grey =
            ImageProcessor.toGreyscale(
                imageData
            );


        /*
         * Apply the selected intensity threshold.
         */

        const binary =
            this.applyThreshold(
                grey
            );


        /*
         * Convert the single-channel binary array
         * back into browser ImageData.
         */

        return ImageProcessor.binaryToImageData(
            binary,
            width,
            height
        );
    }


    /* =====================================================
       APPLY THRESHOLD
       ===================================================== */

    applyThreshold(
        pixels
    ) {

        const output =
            new Uint8Array(
                pixels.length
            );


        for (
            let i = 0;
            i < pixels.length;
            i++
        ) {

            /*
             * Pixels at or above the threshold become
             * white.
             *
             * Pixels below the threshold become black.
             */

            output[i] =
                pixels[i] >=
                this.threshold
                    ? 1
                    : 0;
        }


        return output;
    }


    /* =====================================================
       INVERTED THRESHOLD
       ===================================================== */

    detectInverted(
        imageData
    ) {

        if (!imageData) {

            throw new Error(
                "ImageData is required."
            );
        }


        const grey =
            ImageProcessor.toGreyscale(
                imageData
            );


        const output =
            new Uint8Array(
                grey.length
            );


        for (
            let i = 0;
            i < grey.length;
            i++
        ) {

            output[i] =
                grey[i] >=
                this.threshold
                    ? 0
                    : 1;
        }


        return ImageProcessor.binaryToImageData(
            output,
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       GREYSCALE THRESHOLD
       ===================================================== */

    detectGreyscale(
        imageData
    ) {

        if (!imageData) {

            throw new Error(
                "ImageData is required."
            );
        }


        const grey =
            ImageProcessor.toGreyscale(
                imageData
            );


        const output =
            new Float32Array(
                grey.length
            );


        for (
            let i = 0;
            i < grey.length;
            i++
        ) {

            /*
             * Keep the original intensity for pixels
             * that pass the threshold.
             */

            if (
                grey[i] >=
                this.threshold
            ) {

                output[i] =
                    grey[i];

            } else {

                output[i] =
                    0;
            }
        }


        return ImageProcessor.arrayToImageData(
            output,
            imageData.width,
            imageData.height
        );
    }


    /* =====================================================
       GET RAW BINARY DATA
       ===================================================== */

    detectRaw(
        imageData
    ) {

        if (!imageData) {

            throw new Error(
                "ImageData is required."
            );
        }


        const grey =
            ImageProcessor.toGreyscale(
                imageData
            );


        return this.applyThreshold(
            grey
        );
    }


    /* =====================================================
       SET THRESHOLD
       ===================================================== */

    setThreshold(
        value
    ) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return;
        }


        this.threshold =
            ImageProcessor.clamp(
                Math.round(value),
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