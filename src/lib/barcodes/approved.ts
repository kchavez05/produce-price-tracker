import proposals from '../../../catalog/proposals/2026-11-09-barcode-qualification/mapping-proposals.json';
import envelope from '../../../catalog/proposals/2026-11-09-barcode-qualification/review-envelope.json';
import decision from '../../../catalog/proposals/2026-11-09-barcode-qualification/decision-record.json';
import audit from '../../../catalog/proposals/2026-11-09-barcode-qualification/source-audit.json';

export const BARCODE_PACKET_DIGEST = 'f4888a5802f555b2919ed6b2ea6b5b9041876aa918153520c1d0a95299decb00';
export const BARCODE_SCHEMA_VERSION = 1;
export const BARCODE_SNAPSHOT_DATE = '2026-10-29';
export const BARCODE_SOURCE_MANIFEST = audit.source_manifest;
export const BARCODE_MAPPING_DIGEST = envelope.files['catalog/proposals/2026-11-09-barcode-qualification/mapping-proposals.json'];
export const approvedBarcodeMappings = proposals.rules.flatMap((rule) => rule.status === 'proposed_not_active' &&
  rule.rule_id && rule.ingredient_id && rule.lookup_key && rule.source_row_fingerprint && rule.original_barcode && rule.publication_date
  ? [{ ruleId: rule.rule_id, ingredientId: rule.ingredient_id, key: rule.lookup_key, fdcId: rule.fdc_id,
    fingerprint: rule.source_row_fingerprint, originalBarcode: rule.original_barcode, publicationDate: rule.publication_date }] : []);
export function barcodeApprovalValid(): boolean {
  return decision.status === 'approved_for_implementation' && decision.packetSha256 === BARCODE_PACKET_DIGEST &&
    envelope.packetSha256 === BARCODE_PACKET_DIGEST && ['BQ-01', 'BQ-02', 'BQ-03', 'BQ-04'].every((id) => decision.approvedDecisions.includes(id)) && approvedBarcodeMappings.length === 16;
}
