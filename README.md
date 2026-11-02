# Jenga-Code Edge Detection Studio

Extract the contents of this ZIP into `public_html/apps/edge-detector/`, replacing matching files. Keep the existing URL. Press Ctrl+F5. No build step, account, Java, server-side image processor or API key is required. Serve over HTTP(S): the processing worker will not reliably load from file://.

## Design and controls
One central photo transforms in place into a computed edge map. Three-column copper/ivory editorial layout, identical shared compass logo, illustrated masthead and a new lens/shell sidebar study. The bundled bridge is an explicitly labelled AI-generated sample photo. Uploads remain local. Drop a file on the photo or use Upload photo; use the sample button to return to the bridge.

Sobel, real Canny (Gaussian + gradient + nonmaximum suppression + double threshold + 8-connected hysteresis), and a circular centre-minus-annulus contrast filter. Centre radius and surround radius, ON/OFF/both polarity, smoothing, response threshold and gain are adjustable where relevant. Canny has its own low/high thresholds. See credits.html for exact numerical conventions and border behaviour. This is educational image processing, not a complete biological retina model or a Hough circle detector.

Play/pause/replay, Original/Edges shortcuts, reverse/forward scrubbing, transition duration, three edge palettes and complete PNG export. Filtering and order sorting run in a local worker. Filter and scan edits reset the reveal; palette changes preserve progress. The image is never moved, warped, or shown in two separate panels. Reduced-motion users get the complete result from Play; manual scrubbing remains available. Hidden tabs pause animation.

## Mandelbrot scan adaptations
All ten priorities from the supplied Java scanorder package: Simple, Radial, Angular, Diamond, Flower, Spiral, Square spiral, Triangle XOR, XOR and Pythagoras (bitwise AND). Java fractional-centre offsets, quadrant tie offsets and stable row-major ties are preserved; Spiral uses truncation toward zero. Band count, petal count and spiral thickness are adjustable. Credits and original MIT copyright notice are retained. Original reference classes are in scanorder-source/; they are not executed in the browser.

## Limits and export
Maximum working longest side 960 pixels, uploads up to 20 MB and 40 MP before resizing. Alpha is composited on white. The output PNG is the complete processed map at working resolution, not the current transition frame or full source resolution. No remote URL loading, backend or stored photo history. Gaussian smoothing and thresholds use working-pixel units. Fixed-duration animation reveals equal pixel-count fractions, not constant-radius speed.

## Files
index.html; css/style.css; js/app.js (UI, loading, reveal); js/worker.js (worker jobs and cached scan order); js/EdgeEngine.js (filters); js/ScanOrders.js (Java priority adaptations); images/; credits.html; SCANORDER-LICENSE.txt; scanorder-source/; tests/core.cjs.

## Validation
Run `node tests/core.cjs`. Tests cover uniform/impulse/step images, circular disc/ring calculations against a brute-force border oracle, Gaussian uniformity, Sobel magnitude, Canny thinning and hysteresis connectivity, all ten scan permutations with stable priority ties, reverse reveal, and every filter end to end.
