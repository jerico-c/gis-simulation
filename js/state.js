/**
 * Mengelola state (data) aplikasi secara terpusat.
 * Termasuk nodes, edges, dan mode interaksi saat ini.
 */

// State utama aplikasi
export let state = {
    currentMode: 'pan',
    nodes: [],
    edges: [],
    nextNodeId: 1,
    nextEdgeId: 1,
    isDrawingEdge: false,
    firstNodeForEdge: null,
};

// Fungsi untuk mengubah mode aplikasi
export function setMode(mode) {
    state.currentMode = mode;
    document.getElementById('map').style.cursor = mode.startsWith('add') || mode === 'draw-kabel' ? 'crosshair' : 'grab';
    if (mode !== 'draw-kabel') {
        state.isDrawingEdge = false;
        state.firstNodeForEdge = null;
    }
}

// Fungsi untuk menambah data node baru ke state
export function addNode(node) {
    state.nodes.push(node);
    state.nextNodeId++;
}

// Fungsi untuk menambah data edge baru ke state
export function addEdge(edge) {
    state.edges.push(edge);
    state.nextEdgeId++;
}

// Helper untuk mencari node berdasarkan ID
export function findNodeById(id) {
    return state.nodes.find(n => n.id === id);
}

// Helper untuk mencari semua edge yang terhubung ke sebuah node
export function findEdgesForNode(nodeId) {
    return state.edges.filter(e => e.source === nodeId || e.target === nodeId);
}

// Fungsi untuk menghapus node dan edge yang terhubung
export function deleteNode(nodeId) {
    const nodeToDelete = findNodeById(nodeId);
    if (!nodeToDelete) return;

    // Hapus marker dari peta
    if (nodeToDelete.leafletObject) {
        nodeToDelete.leafletObject.remove();
    }

    // Hapus semua edge yang terhubung
    const edgesToDelete = findEdgesForNode(nodeId);
    edgesToDelete.forEach(edge => {
        if (edge.leafletObject) {
            edge.leafletObject.remove();
        }
    });
    state.edges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    
    // Hapus node dari array state
    state.nodes = state.nodes.filter(n => n.id !== nodeId);
}