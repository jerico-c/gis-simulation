import { state, setMode, deleteNode, findNodeById } from './state.js';
import { initializeMap, handleEdgeDrawing } from './map-logic.js';
import { displayNodeProperties, clearProperties, updateLinkBudgetPanel, handleSplitterChange } from './ui.js';
import { calculateAndValidate } from './link-budget.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Callback yang dijalankan saat node di peta diklik
    function onNodeClick(node) {
        if (state.isDrawingEdge) {
            handleEdgeDrawing(node);
            if (!state.isDrawingEdge) { // Jika gambar selesai
                setMode('pan');
            }
        } else {
            displayNodeProperties(node);
            if (node.type === 'PELANGGAN') {
                const resultsHtml = calculateAndValidate(node.id);
                updateLinkBudgetPanel(resultsHtml);
            } else {
                 updateLinkBudgetPanel('<h4><center>Info Link Budget</center></h4><p>Pilih node Pelanggan untuk memulai kalkulasi.</p>');
            }
        }
    }
    
    // Inisialisasi peta dan teruskan callback
    const map = initializeMap(onNodeClick);

    // Event listener terpusat untuk panel properti (menangani tombol hapus & ubah splitter)
    const propertiesPanel = document.getElementById('properties-panel');
    propertiesPanel.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'delete-node-btn') {
            const nodeId = parseInt(e.target.getAttribute('data-node-id'));
            if (confirm(`Apakah Anda yakin ingin menghapus perangkat ini dan semua kabel yang terhubung?`)) {
                deleteNode(nodeId);
                clearProperties();
                updateLinkBudgetPanel("<h4><center>Info Link Budget</center></h4><p>Perangkat telah dihapus.</p>");
            }
        }
    });
    propertiesPanel.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'splitter-ratio') {
            handleSplitterChange(e);
        }
    });

    // Event listeners untuk tombol-tombol di toolbar
    document.getElementById('add-sto').addEventListener('click', () => setMode('add-sto'));
    document.getElementById('add-odc').addEventListener('click', () => setMode('add-odc'));
    document.getElementById('add-odp').addEventListener('click', () => setMode('add-odp'));
    document.getElementById('add-pelanggan').addEventListener('click', () => setMode('add-pelanggan'));
    document.getElementById('draw-kabel').addEventListener('click', () => {
        setMode('draw-kabel');
        state.isDrawingEdge = true;
        state.firstNodeForEdge = null;
    });

});