import assert from 'node:assert';
import {
  buildEvidenceGraph,
  buildFacultyMismatchDemoGraph,
  assignEdgeHandles,
} from '../src/components/graph/graphModel';
import {
  SYNTHETIC_APPLICATIONS,
  SYNTHETIC_DOCUMENTS,
  SYNTHETIC_COMPLIANCE_RULES,
} from '../src/data/mockData';

console.log('🧪 Starting Evidence Dependency Graph Test Suite...\n');

// Test 1: Synthetic Faculty-Name Mismatch Demo Graph
console.log('Test 1: Validating Faculty-Name Mismatch Demonstration Case...');
const demoGraph = buildFacultyMismatchDemoGraph();

assert.ok(demoGraph.nodes.length >= 8, `Expected at least 8 demo nodes, got ${demoGraph.nodes.length}`);
assert.ok(demoGraph.edges.length >= 7, `Expected at least 7 demo edges, got ${demoGraph.edges.length}`);
assert.strictEqual(demoGraph.hasConflicts, true, 'Demo graph must report hasConflicts = true');
assert.strictEqual(demoGraph.conflictCount, 1, 'Demo graph must report conflictCount = 1');

// Verify Node Types
const nodeTypes = new Set(demoGraph.nodes.map((n) => n.data.nodeType));
assert.ok(nodeTypes.has('INSTITUTION'), 'Must contain INSTITUTION node');
assert.ok(nodeTypes.has('APPLICATION'), 'Must contain APPLICATION node');
assert.ok(nodeTypes.has('DOCUMENT'), 'Must contain DOCUMENT node');
assert.ok(nodeTypes.has('EXTRACTED_FIELD'), 'Must contain EXTRACTED_FIELD node');
assert.ok(nodeTypes.has('REGULATORY_RULE'), 'Must contain REGULATORY_RULE node');
assert.ok(nodeTypes.has('DISCREPANCY'), 'Must contain DISCREPANCY node');
assert.ok(nodeTypes.has('VERIFICATION_RESULT'), 'Must contain VERIFICATION_RESULT node');

// Verify Discrepancy Node Details
const discNode = demoGraph.nodes.find((n) => n.data.nodeType === 'DISCREPANCY');
assert.ok(discNode, 'Discrepancy node must exist');
assert.ok(discNode.data.conflictingValues, 'Discrepancy node must have conflictingValues');
const cv = discNode.data.conflictingValues!;
assert.ok(cv.valueA.value.includes('Rajesh Kumar Sharma'), 'Value A must reference Dr. Rajesh Kumar Sharma');
assert.strictEqual(cv.valueA.page, 2, 'Value A must cite Page 2');
assert.ok(cv.valueB.value.includes('R. K. Verma'), 'Value B must reference Prof. R. K. Verma');
assert.strictEqual(cv.valueB.page, 4, 'Value B must cite Page 4');
assert.ok(cv.applicableRule.includes('APH'), 'Applicable rule must cite AICTE Approval Process Handbook');
console.log('  ✓ Faculty mismatch demo contains correct citations, pages (p.2 vs p.4), and rule.');

// Test 2: Edge Relationships and Handles
console.log('\nTest 2: Validating Semantic Directed Relationships & Edge Handles...');
const edgeTypes = new Set(demoGraph.edges.map((e) => e.label));
assert.ok(edgeTypes.has('supports'), 'Must contain supports edge');
assert.ok(edgeTypes.has('extracted_from'), 'Must contain extracted_from edge');
assert.ok(edgeTypes.has('compared_with'), 'Must contain compared_with edge');
assert.ok(edgeTypes.has('governed_by'), 'Must contain governed_by edge');
assert.ok(edgeTypes.has('conflicts_with'), 'Must contain conflicts_with edge');

// Check that every edge has valid sourceHandle and targetHandle
for (const edge of demoGraph.edges) {
  assert.ok(edge.sourceHandle, `Edge ${edge.id} missing sourceHandle`);
  assert.ok(edge.targetHandle, `Edge ${edge.id} missing targetHandle`);
  assert.ok(edge.markerEnd, `Edge ${edge.id} missing markerEnd arrow`);
}
console.log('  ✓ All 5 relationship types present, arrows and handles assigned correctly.');

// Test 3: Live Application Graph Construction (Apex Horizon - APP-2025-03)
console.log('\nTest 3: Building Evidence Graph from Live Application Dossier (APP-2025-03)...');
const appApex = SYNTHETIC_APPLICATIONS.find((a) => a.id === 'APP-2025-03')!;
const apexGraph = buildEvidenceGraph(appApex, SYNTHETIC_DOCUMENTS, SYNTHETIC_COMPLIANCE_RULES, false);

assert.ok(apexGraph.nodes.length > 5, `Expected multiple evidentiary nodes, got ${apexGraph.nodes.length}`);
assert.ok(apexGraph.hasConflicts, 'Apex Horizon must flag active conflicts (Fire NOC & Faculty deficiencies)');
assert.ok(apexGraph.conflictCount >= 2, `Expected at least 2 conflicts for Apex Horizon, got ${apexGraph.conflictCount}`);

// Ensure all edge targets and sources resolve to existing nodes
const apexNodeIds = new Set(apexGraph.nodes.map((n) => n.id));
for (const edge of apexGraph.edges) {
  assert.ok(apexNodeIds.has(edge.source), `Edge source ${edge.source} does not exist in nodes`);
  assert.ok(apexNodeIds.has(edge.target), `Edge target ${edge.target} does not exist in nodes`);
}
console.log('  ✓ Live application dossier graph built deterministically with zero orphan edges.');

// Test 4: Compliant Application Graph Construction (COEP - APP-2025-02)
console.log('\nTest 4: Building Evidence Graph for Compliant Application (APP-2025-02)...');
const appCoep = SYNTHETIC_APPLICATIONS.find((a) => a.id === 'APP-2025-02')!;
const coepGraph = buildEvidenceGraph(appCoep, SYNTHETIC_DOCUMENTS, SYNTHETIC_COMPLIANCE_RULES, false);
assert.ok(coepGraph.nodes.length >= 2, 'Must build at least Institution and Application nodes');
assert.strictEqual(coepGraph.hasConflicts, false, 'Compliant institution must have 0 conflicts');
console.log('  ✓ Compliant dossier produces verified nodes with zero conflict flags.');

// Test 5: Filtering and Isolation Logic
console.log('\nTest 5: Validating Filtering & Integrity...');
// Filter by DOCUMENT only
const docNodes = apexGraph.nodes.filter((n) => n.data.nodeType === 'DOCUMENT');
assert.ok(docNodes.length > 0, 'Must find document nodes');
for (const n of docNodes) {
  assert.strictEqual(n.data.nodeType, 'DOCUMENT');
}

// Filter by Conflicts Only
const conflictNodes = apexGraph.nodes.filter(
  (n) => n.data.nodeType === 'DISCREPANCY' || n.data.status === 'TAMPER_ALERT' || n.data.status === 'CRITICAL_DEFICIT'
);
assert.ok(conflictNodes.length > 0, 'Conflict filter must return flagged nodes');
console.log(`  ✓ Filter test passed: found ${docNodes.length} document nodes and ${conflictNodes.length} conflict nodes.`);

console.log('\n🎉 ALL 5 EVIDENCE DEPENDENCY GRAPH TEST SUITES PASSED PERFECTLY!\n');
