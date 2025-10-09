import { state, findNodeById } from './state.js';
import { LOSS_CABLE_PER_KM, LOSS_SPLICE, LOSS_CONNECTOR, LOSS_SPLITTER } from './constants.js';

export function calculateAndValidate(targetNodeId) {
    const targetNode = findNodeById(targetNodeId);
    if (!targetNode || targetNode.type !== 'PELANGGAN') {
        return "<h4><center>Info Link Budget</center></h4><p>Silakan klik node Pelanggan untuk memulai kalkulasi.</p>";
    }

    let path = [];
    let totalLength = 0;
    let visitedNodeIds = new Set();
    let currentNode = targetNode;

    // 1. Traverse dari pelanggan ke STO
    while (currentNode && currentNode.type !== 'STO') {
        path.unshift(currentNode);
        visitedNodeIds.add(currentNode.id);
        
        const upstreamEdge = state.edges.find(e => 
            (e.target === currentNode.id && !visitedNodeIds.has(e.source)) || 
            (e.source === currentNode.id && !visitedNodeIds.has(e.target))
        );

        if (!upstreamEdge) {
            return `<h4>Error</h4><p>Jalur dari ${currentNode.label} terputus! Tidak terhubung ke STO.</p>`;
        }

        totalLength += upstreamEdge.length;
        const upstreamNodeId = (upstreamEdge.source === currentNode.id) ? upstreamEdge.target : upstreamEdge.source;
        currentNode = findNodeById(upstreamNodeId);
    }

    if (!currentNode || currentNode.type !== 'STO') {
        return `<h4>Error</h4><p>Jalur dari ${targetNode.label} ke STO tidak lengkap.</p>`;
    }
    path.unshift(currentNode); // Tambahkan STO ke awal jalur

    // 2. Kalkulasi Redaman
    const cableLoss = totalLength * LOSS_CABLE_PER_KM;
    const spliceCount = Math.floor(totalLength / 3);
    const spliceLoss = spliceCount * LOSS_SPLICE;
    let connectorLoss = 0;
    let splitterLoss = 0;

    path.forEach(node => {
        if (node.type !== 'STO') connectorLoss += (2 * LOSS_CONNECTOR);
        if ((node.type === 'ODC' || node.type === 'ODP') && node.properties.splitterRatio) {
            splitterLoss += LOSS_SPLITTER[node.properties.splitterRatio] || 0;
        }
    });

    const totalLoss = cableLoss + spliceLoss + connectorLoss + splitterLoss;

    // 3. Validasi & Format Output HTML
    const validationStatus = (totalLoss < 26) ? '<strong style="color: green;">DESAIN VALID ✅</strong>' : '<strong style="color: orange;">DESAIN TIDAK OPTIMAL ⚠️</strong>';
    const distanceWarning = (totalLength > 8) ? '<br><strong style="color: red;">PERINGATAN: Jarak > 8km, pertimbangkan Mini OLT!</strong>' : '';

    return `
        <h4>Hasil Link Budget untuk ${targetNode.label}</h4>
        <p>${validationStatus}</p>
        <p><strong>Total Redaman: ${totalLoss.toFixed(2)} dB</strong></p>
        <ul>
            <li>Redaman Kabel (${totalLength.toFixed(2)} km): ${cableLoss.toFixed(2)} dB</li>
            <li>Redaman Sambungan (${spliceCount} splice): ${spliceLoss.toFixed(2)} dB</li>
            <li>Redaman Konektor (${(path.length - 1) * 2} konektor): ${connectorLoss.toFixed(2)} dB</li>
            <li>Redaman Splitter: ${splitterLoss.toFixed(2)} dB</li>
        </ul>
        <p><strong>Jalur:</strong> ${path.map(p => p.label).join(' -> ')}</p>
        <p>${distanceWarning}</p>
    `;
}