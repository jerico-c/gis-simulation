/**
 * Berisi konstanta nilai redaman (loss) berdasarkan
 * Pedoman Desain dan Perencanaan i-ODN (PR.402.08).
 */
export const LOSS_CABLE_PER_KM = 0.35; // Redaman Kabel Fiber Optik per km [cite: 506]
export const LOSS_SPLICE = 0.1; // Redaman per sambungan (splicing) [cite: 506]
export const LOSS_CONNECTOR = 0.25; // Redaman per konektor SC/UPC [cite: 506]
export const LOSS_SPLITTER = {
    2: 4.2,   // Redaman Splitter 1:2 [cite: 506]
    4: 7.8,   // Redaman Splitter 1:4 [cite: 506]
    8: 11.4,  // Redaman Splitter 1:8 [cite: 506]
    16: 15.0, // Redaman Splitter 1:16 [cite: 506]
    32: 18.6  // Redaman Splitter 1:32 [cite: 506]
};