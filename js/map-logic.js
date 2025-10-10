import { state, addNode, addEdge, findNodeById, findEdgesForNode } from './state.js';
import { generateLabel } from './utils.js';

let map;
let onNodeClickCallback; // Callback untuk menangani klik pada node

// Inisialisasi peta
export function initializeMap(onNodeClick) {
    onNodeClickCallback = onNodeClick;
    map = L.map('map').setView([-7.475, 110.218], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on('click', (e) => {
        if (state.currentMode.startsWith('add')) {
            const nodeType = state.currentMode.split('-')[1].toUpperCase();
            createNodeOnMap(e.latlng, nodeType);
        }
    });

    return map;
}

// Membuat node baru di peta
export function createNodeOnMap(latlng, type) {
    const newNode = {
        id: state.nextNodeId,
        type,
        lat: latlng.lat,
        lng: latlng.lng,
        properties: {},
    };

    newNode.label = generateLabel(newNode);
    if (!newNode.label) return; // Batal jika user menekan cancel pada prompt

    if (type === 'ODC' || type === 'ODP') {
        newNode.properties.splitterRatio = 8;
    }

    addNode(newNode); // Simpan ke state

    const marker = L.marker([latlng.lat, latlng.lng], { draggable: true }).addTo(map);
    marker.bindTooltip(newNode.label, { permanent: true, direction: 'top', offset: [0, -10] });
    
    marker.on('click', () => onNodeClickCallback(newNode));

    // Event listener untuk fitur edit (drag/move)
    marker.on('dragend', (event) => {
        const newPosition = event.target.getLatLng();
        newNode.lat = newPosition.lat;
        newNode.lng = newPosition.lng;

        const connectedEdges = findEdgesForNode(newNode.id);
        connectedEdges.forEach(edge => {
            const sourceNode = findNodeById(edge.source);
            const targetNode = findNodeById(edge.target);
            const newLatLngs = [[sourceNode.lat, sourceNode.lng], [targetNode.lat, targetNode.lng]];
            
            edge.leafletObject.setLatLngs(newLatLngs);
            
            const newDistanceMeters = L.latLng(newLatLngs[0]).distanceTo(L.latLng(newLatLngs[1]));
            edge.length = newDistanceMeters / 1000;
        });
        
        // Panggil kalkulasi ulang jika ada pelanggan aktif
        const activeCustomer = state.nodes.find(n => n.type === 'PELANGGAN' && document.getElementById('link-budget-panel').innerHTML.includes(n.label));
        if (activeCustomer) onNodeClickCallback(activeCustomer);
    });

    newNode.leafletObject = marker;
}

// Menangani logika menggambar kabel (edge)
export function handleEdgeDrawing(clickedNode) {
    if (!state.firstNodeForEdge) {
        state.firstNodeForEdge = clickedNode;
    } else {
        const secondNode = clickedNode;
        if (state.firstNodeForEdge.id === secondNode.id) return;

        const latlng1 = [state.firstNodeForEdge.lat, state.firstNodeForEdge.lng];
        const latlng2 = [secondNode.lat, secondNode.lng];
        const distanceKm = L.latLng(latlng1).distanceTo(L.latLng(latlng2)) / 1000;

        const newEdge = {
            id: `e${state.nextEdgeId}`,
            source: state.firstNodeForEdge.id,
            target: secondNode.id,
            length: distanceKm,
            type: 'Kabel'
        };

        addEdge(newEdge);

        const polyline = L.polyline([latlng1, latlng2], { color: 'red' }).addTo(map);
        newEdge.leafletObject = polyline;
        
        onNodeClickCallback(clickedNode); // panggil callback untuk reset mode
    }
}