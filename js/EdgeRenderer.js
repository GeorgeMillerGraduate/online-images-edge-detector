class EdgeRenderer {

    constructor(
        sourceCanvas,
        edgeCanvas
    ) {

        this.sourceCanvas =
            sourceCanvas;

        this.edgeCanvas =
            edgeCanvas;


        this.sourceContext =
            sourceCanvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        this.edgeContext =
            edgeCanvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        this.sourceImage = null;

        this.sourceImageData = null;

        this.edgeImageData = null;

        this.inverted = false;
    }


    /* =====================================================
       LOAD IMAGE
       ===================================================== */

    loadImage(file) {

        return new Promise(
            (resolve, reject) => {

                if (!file) {

                    reject(
                        new Error(
                            "No image file supplied."
                        )
                    );

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload = event => {

                    const image =
                        new Image();


                    image.onload = () => {

                        this.sourceImage =
                            image;


                        this.inverted =
                            false;


                        this.drawSourceImage();


                        resolve({
                            width: image.naturalWidth,
                            height: image.naturalHeight
                        });
                    };


                    image.onerror = () => {

                        reject(
                            new Error(
                                "The selected image could not be loaded."
                            )
                        );
                    };


                    image.src =
                        event.target.result;
                };


                reader.onerror = () => {

                    reject(
                        new Error(
                            "The selected file could not be read."
                        )
                    );
                };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    /* =====================================================
       DRAW SOURCE IMAGE
       ===================================================== */

    drawSourceImage() {

        if (!this.sourceImage) {

            return;
        }


        const width =
            this.sourceImage.naturalWidth;


        const height =
            this.sourceImage.naturalHeight;


        /*
         * The internal canvas resolution matches the
         * original image exactly.
         *
         * CSS is responsible for fitting the canvas
         * into the visualiser.
         */

        this.sourceCanvas.width =
            width;

        this.sourceCanvas.height =
            height;


        this.sourceContext.clearRect(
            0,
            0,
            width,
            height
        );


        this.sourceContext.drawImage(
            this.sourceImage,
            0,
            0,
            width,
            height
        );


        /*
         * Save the unmodified pixel data for the
         * edge-detection algorithms.
         */

        this.sourceImageData =
            this.sourceContext.getImageData(
                0,
                0,
                width,
                height
            );


        /*
         * Give the result canvas the same resolution.
         */

        this.edgeCanvas.width =
            width;

        this.edgeCanvas.height =
            height;


        this.edgeContext.clearRect(
            0,
            0,
            width,
            height
        );
    }


    /* =====================================================
       GET SOURCE IMAGE DATA
       ===================================================== */

    getSourceImageData() {

        if (!this.sourceImageData) {

            return null;
        }


        /*
         * Return a copy rather than the stored original.
         *
         * This prevents an algorithm from accidentally
         * modifying our source pixels.
         */

        return new ImageData(
            new Uint8ClampedArray(
                this.sourceImageData.data
            ),
            this.sourceImageData.width,
            this.sourceImageData.height
        );
    }


    /* =====================================================
       DISPLAY EDGE IMAGE
       ===================================================== */

    renderEdgeImage(imageData) {

        if (!imageData) {

            return;
        }


        /*
         * Store an untouched copy of the detector output.
         */

        this.edgeImageData =
            new ImageData(
                new Uint8ClampedArray(
                    imageData.data
                ),
                imageData.width,
                imageData.height
            );


        this.edgeCanvas.width =
            imageData.width;

        this.edgeCanvas.height =
            imageData.height;


        this.inverted =
            false;


        this.edgeContext.putImageData(
            this.edgeImageData,
            0,
            0
        );
    }


    /* =====================================================
       RENDER IMAGE DATA
       ===================================================== */

    render(imageData) {

        this.renderEdgeImage(
            imageData
        );
    }


    /* =====================================================
       INVERT EDGE MAP
       ===================================================== */

    invert() {

        if (!this.edgeImageData) {

            return;
        }


        this.inverted =
            !this.inverted;


        const source =
            this.edgeImageData.data;


        const output =
            new ImageData(
                this.edgeImageData.width,
                this.edgeImageData.height
            );


        const destination =
            output.data;


        for (
            let i = 0;
            i < source.length;
            i += 4
        ) {

            if (this.inverted) {

                destination[i] =
                    255 - source[i];

                destination[i + 1] =
                    255 - source[i + 1];

                destination[i + 2] =
                    255 - source[i + 2];

            } else {

                destination[i] =
                    source[i];

                destination[i + 1] =
                    source[i + 1];

                destination[i + 2] =
                    source[i + 2];
            }


            destination[i + 3] =
                source[i + 3];
        }


        this.edgeContext.putImageData(
            output,
            0,
            0
        );
    }


    /* =====================================================
       CLEAR SOURCE
       ===================================================== */

    clearSource() {

        this.sourceContext.clearRect(
            0,
            0,
            this.sourceCanvas.width,
            this.sourceCanvas.height
        );


        this.sourceCanvas.width =
            300;

        this.sourceCanvas.height =
            150;


        this.sourceImage =
            null;

        this.sourceImageData =
            null;
    }


    /* =====================================================
       CLEAR RESULT
       ===================================================== */

    clearEdge() {

        this.edgeContext.clearRect(
            0,
            0,
            this.edgeCanvas.width,
            this.edgeCanvas.height
        );


        this.edgeCanvas.width =
            300;

        this.edgeCanvas.height =
            150;


        this.edgeImageData =
            null;

        this.inverted =
            false;
    }


    /* =====================================================
       RESET
       ===================================================== */

    reset() {

        this.clearSource();

        this.clearEdge();
    }


    /* =====================================================
       HAS SOURCE IMAGE
       ===================================================== */

    hasSourceImage() {

        return (
            this.sourceImageData !==
            null
        );
    }


    /* =====================================================
       HAS RESULT
       ===================================================== */

    hasEdgeImage() {

        return (
            this.edgeImageData !==
            null
        );
    }


    /* =====================================================
       IMAGE DIMENSIONS
       ===================================================== */

    getWidth() {

        if (!this.sourceImageData) {

            return 0;
        }


        return this.sourceImageData.width;
    }


    getHeight() {

        if (!this.sourceImageData) {

            return 0;
        }


        return this.sourceImageData.height;
    }


    /* =====================================================
       DOWNLOAD RESULT
       ===================================================== */

    download(
        filename = "edge-detection.png"
    ) {

        if (!this.edgeImageData) {

            return false;
        }


        const link =
            document.createElement(
                "a"
            );


        link.download =
            filename;


        /*
         * Use the current canvas rather than the stored
         * ImageData so an inverted result is downloaded
         * exactly as it appears on screen.
         */

        link.href =
            this.edgeCanvas.toDataURL(
                "image/png"
            );


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        return true;
    }


    /* =====================================================
       GET RESULT
       ===================================================== */

    getEdgeImageData() {

        if (!this.edgeImageData) {

            return null;
        }


        return new ImageData(
            new Uint8ClampedArray(
                this.edgeImageData.data
            ),
            this.edgeImageData.width,
            this.edgeImageData.height
        );
    }
}