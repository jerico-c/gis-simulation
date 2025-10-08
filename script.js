document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // TAHAP 1: INISIALISASI PETA
    // =================================================================
    const map = L.map('map').setView([-7.475, 110.218], 14); // Koordinat pusat Kota Magelang

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    console.log("Peta berhasil diinisialisasi!");

    // =================================================================
    // STATE APLIKASI & KONSTANTA
    // =================================================================
    let currentMode = 'pan'; // 'pan', 'add-sto', 'add-odc', 'add-odp', 'add-pelanggan', 'draw-kabel'
    let nodes = [];
    let edges = [];
    let nextNodeId = 1;
    let nextEdgeId = 1;
    let isDrawingEdge = false;
    let firstNodeForEdge = null;

    // --- Konstanta Standar Teknis Telkom (berdasarkan PR.402.08) ---
    const LOSS_CABLE_PER_KM = 0.35; // dB/km [cite: 5163]
    const LOSS_SPLICE = 0.1; // dB per sambungan [cite: 5163]
    const LOSS_CONNECTOR = 0.25; // dB per konektor [cite: 5163]
    const LOSS_SPLITTER = {
        2: 4.2,   // [cite: 5163]
        4: 7.8,   // [cite: 5163]
        8: 11.4,  // [cite: 5163]
        16: 15.0, // [cite: 5163]
        32: 18.6  // [cite: 5163]
    };
    
    // =================================================================
    // REFERENSI DOM & EVENT LISTENERS
    // =================================================================
    const mapContainer = document.getElementById('map');
    const propertiesPanel = document.getElementById('properties-panel');
    const linkBudgetPanel = document.getElementById('link-budget-panel');

    document.getElementById('add-sto').addEventListener('click', () => setMode('add-sto'));
    document.getElementById('add-odc').addEventListener('click', () => setMode('add-odc'));
    document.getElementById('add-odp').addEventListener('click', () => setMode('add-odp'));
    document.getElementById('add-pelanggan').addEventListener('click', () => setMode('add-pelanggan'));
    document.getElementById('draw-kabel').addEventListener('click', () => {
        setMode('draw-kabel');
        isDrawingEdge = true;
        firstNodeForEdge = null;
        console.log("Masuk mode gambar kabel. Klik node pertama.");
    });

    function setMode(mode) {
        currentMode = mode;
        mapContainer.style.cursor = mode.startsWith('add') || mode === 'draw-kabel' ? 'crosshair' : 'grab';
        if (mode !== 'draw-kabel') {
            isDrawingEdge = false;
            firstNodeForEdge = null;
        }
    }

    // =================================================================
    // FUNGSI UTAMA (NODES & EDGES)
    // =================================================================

    // --- Penanganan Klik pada Peta ---
    map.on('click', (e) => {
        if (currentMode.startsWith('add')) {
            const nodeType = currentMode.split('-')[1].toUpperCase();
            addNode(e.latlng, nodeType);
            setMode('pan'); // Kembali ke mode normal
        }
    });

    // --- Fungsi Menambahkan Node ---
    function addNode(latlng, type) {
        const newNode = {
            id: nextNodeId++,
            type: type,
            lat: latlng.lat,
            lng: latlng.lng,
            properties: {}
        };

        newNode.label = generateLabel(newNode);

        if (type === 'ODC' || type === 'ODP') {
            newNode.properties.splitterRatio = 8; // Default splitter 1:8
        }

        nodes.push(newNode);

        const marker = L.marker([latlng.lat, latlng.lng]).addTo(map);
        marker.bindTooltip(newNode.label, { permanent: true, direction: 'top', offset: [0, -10] });
        
        marker.on('click', () => {
            if (isDrawingEdge) {
                handleEdgeDrawing(newNode);
            } else {
                displayNodeProperties(newNode);
                if (newNode.type === 'PELANGGAN') {
                    calculateAndValidate(newNode.id);
                }
            }
        });

        newNode.leafletObject = marker;
        console.log("Node ditambahkan:", newNode);
    }

    // --- Fungsi Menggambar Kabel ---
    function handleEdgeDrawing(clickedNode) {
        if (!firstNodeForEdge) {
            firstNodeForEdge = clickedNode;
            console.log("Node pertama dipilih:", clickedNode.label, ". Klik node kedua.");
        } else {
            const secondNode = clickedNode;
            if (firstNodeForEdge.id === secondNode.id) {
                console.log("Tidak bisa menghubungkan node ke dirinya sendiri.");
                return;
            }

            const latlng1 = [firstNodeForEdge.lat, firstNodeForEdge.lng];
            const latlng2 = [secondNode.lat, secondNode.lng];
            const distanceMeters = L.latLng(latlng1).distanceTo(L.latLng(latlng2));
            const distanceKm = (distanceMeters / 1000);

            // Menentukan tipe kabel secara sederhana
            let edgeType = "Drop";
            if ((firstNodeForEdge.type === 'STO' && secondNode.type === 'ODC') || (firstNodeForEdge.type === 'ODC' && secondNode.type === 'STO')) {
                edgeType = "Feeder";
            } else if ((firstNodeForEdge.type === 'ODC' && secondNode.type === 'ODP') || (firstNodeForEdge.type === 'ODP' && secondNode.type === 'ODC')) {
                edgeType = "Distribusi";
            }

            const newEdge = {
                id: `e${nextEdgeId++}`,
                source: firstNodeForEdge.id,
                target: secondNode.id,
                length: distanceKm,
                type: edgeType
            };

            edges.push(newEdge);

            const polyline = L.polyline([latlng1, latlng2], { color: 'red' }).addTo(map);
            newEdge.leafletObject = polyline;

            console.log("Kabel dibuat:", newEdge);

            firstNodeForEdge = null;
            setMode('pan');
        }
    }

    // =================================================================
    // FUNGSI UI & DASHBOARD
    // =================================================================

    function displayNodeProperties(node) {
        propertiesPanel.innerHTML = `<h4>Properti ${node.label}</h4>`;
        propertiesPanel.innerHTML += `ID: ${node.id}<br>`;
        propertiesPanel.innerHTML += `Tipe: ${node.type}<br>`;
        propertiesPanel.innerHTML += `Koordinat: ${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}<br>`;

        if (node.type === 'ODC' || node.type === 'ODP') {
            propertiesPanel.innerHTML += `
                <label for="splitter-ratio">Rasio Splitter 1:</label>
                <select id="splitter-ratio">
                    <option value="2" ${node.properties.splitterRatio === 2 ? 'selected' : ''}>2</option>
                    <option value="4" ${node.properties.splitterRatio === 4 ? 'selected' : ''}>4</option>
                    <option value="8" ${node.properties.splitterRatio === 8 ? 'selected' : ''}>8</option>
                    <option value="16" ${node.properties.splitterRatio === 16 ? 'selected' : ''}>16</option>
                    <option value="32" ${node.properties.splitterRatio === 32 ? 'selected' : ''}>32</option>
                </select>
            `;
            document.getElementById('splitter-ratio').addEventListener('change', (e) => {
                node.properties.splitterRatio = parseInt(e.target.value);
                console.log(`Rasio splitter untuk ${node.label} diubah menjadi 1:${node.properties.splitterRatio}`);
                // Otomatis kalkulasi ulang jika ada pelanggan yang sedang aktif
                const activeCustomer = nodes.find(n => n.type === 'PELANGGAN' && linkBudgetPanel.innerHTML.includes(n.label));
                if (activeCustomer) {
                    calculateAndValidate(activeCustomer.id);
                }
            });
        }
    }
    
    // =================================================================
    // MESIN KALKULASI & VALIDASI
    // =================================================================
    const findNodeById = (id) => nodes.find(n => n.id === id);
    const findEdgeByTarget = (targetId) => edges.find(e => e.target === targetId || e.source === targetId);
    
    function calculateAndValidate(targetNodeId) {
        let currentNode = findNodeById(targetNodeId);
        if (!currentNode || currentNode.type !== 'PELANGGAN') {
            linkBudgetPanel.innerHTML = "<h4><center>Info Link Budget</center></h4><p>Silakan klik node Pelanggan untuk memulai kalkulasi.</p>";
            return;
        }

        let path = [currentNode];
        let totalLength = 0;
        let visitedNodeIds = new Set([currentNode.id]);

        let tempCurrentNode = currentNode;
        while (tempCurrentNode && tempCurrentNode.type !== 'STO') {
            const upstreamEdge = edges.find(e => (e.target === tempCurrentNode.id && !visitedNodeIds.has(e.source)) || (e.source === tempCurrentNode.id && !visitedNodeIds.has(e.target)));

            if (!upstreamEdge) {
                linkBudgetPanel.innerHTML = `<h4>Error</h4><p>Jalur dari ${tempCurrentNode.label} terputus! Tidak terhubung ke STO.</p>`;
                return;
            }

            const upstreamNodeId = upstreamEdge.source === tempCurrentNode.id ? upstreamEdge.target : upstreamEdge.source;
            const upstreamNode = findNodeById(upstreamNodeId);
            
            totalLength += upstreamEdge.length;
            path.unshift(upstreamNode);
            visitedNodeIds.add(upstreamNode.id);
            tempCurrentNode = upstreamNode;
        }

        if (tempCurrentNode && tempCurrentNode.type === 'STO') {
            let cableLoss = totalLength * LOSS_CABLE_PER_KM;
            let spliceCount = Math.floor(totalLength / 3);
            let spliceLoss = spliceCount * LOSS_SPLICE;
            let connectorLoss = 0;
            let splitterLoss = 0;
            
            let pathDetailsHtml = `<strong>Analisis Jalur:</strong> ${path.map(p => p.label).join(' -> ')}<br>`;
            pathDetailsHtml += `<strong>Total Panjang Kabel:</strong> ${totalLength.toFixed(2)} km`;

            path.forEach(node => {
                if (node.type !== 'STO') connectorLoss += (2 * LOSS_CONNECTOR);
                if ((node.type === 'ODC' || node.type === 'ODP') && node.properties.splitterRatio) {
                    const ratio = node.properties.splitterRatio;
                    const loss = LOSS_SPLITTER[ratio] || 0;
                    splitterLoss += loss;
                }
            });
            
            totalLoss = cableLoss + spliceLoss + connectorLoss + splitterLoss;
            
            let validationStatus = (totalLoss < 26) ? '<strong style="color: green;">DESAIN VALID ✅</strong>' : '<strong style="color: orange;">DESAIN TIDAK OPTIMAL ⚠️</strong>';
            let distanceWarning = (totalLength > 8) ? '<br><strong style="color: red;">PERINGATAN: Jarak > 8km, pertimbangkan Mini OLT!</strong>' : '';

            linkBudgetPanel.innerHTML = `
                <h4>Hasil Link Budget untuk ${findNodeById(targetNodeId).label}</h4>
                <p>${validationStatus}</p>
                <p><strong>Total Redaman: ${totalLoss.toFixed(2)} dB</strong></p>
                <ul>
                    <li>Redaman Kabel: ${cableLoss.toFixed(2)} dB</li>
                    <li>Redaman Sambungan (${spliceCount} splice): ${spliceLoss.toFixed(2)} dB</li>
                    <li>Redaman Konektor (${(path.length -1) * 2} konektor): ${connectorLoss.toFixed(2)} dB</li>
                    <li>Redaman Splitter: ${splitterLoss.toFixed(2)} dB</li>
                </ul>
                <p>${pathDetailsHtml}</p>
                <p>${distanceWarning}</p>
            `;
        } else {
            linkBudgetPanel.innerHTML = `<h4>Error</h4><p>Jalur dari ${findNodeById(targetNodeId).label} ke STO tidak lengkap.</p>`;
        }
    }
    
    // =================================================================
    // FUNGSI PELABELAN OTOMATIS
    // =================================================================
    function generateLabel(node) {
        const stoCode = "MGL";
        let label = '';
        
        switch(node.type) {
            case 'STO':
                label = `STO-${stoCode}`;
                break;
            case 'ODC':
                const odcCount = nodes.filter(n => n.type === 'ODC').length + 1;
                const odcCode = prompt(`Masukkan kode unik ODC (contoh: FAA):`, `FA${String.fromCharCode(64 + odcCount)}`);
                if (odcCode) label = `ODC-${stoCode}-${odcCode.toUpperCase()}`;
                break;
            case 'ODP':
                const odpCount = nodes.filter(n => n.type === 'ODP').length + 1;
                // Logika ini bisa disempurnakan untuk mengambil nama ODC induk
                label = `ODP-${stoCode}-D01/${String(odpCount).padStart(3, '0')}`;
                break;
            case 'PELANGGAN':
                label = `CUST-${node.id}`;
                break;
            default:
                label = `${node.type}-${node.id}`;
        }
        return label || `${node.type}-${node.id}`; // Fallback jika user cancel
    }
});
