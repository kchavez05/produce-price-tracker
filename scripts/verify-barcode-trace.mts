import { verifyBarcodeTrace } from './lib/barcode-trace';
console.log(JSON.stringify({ ...await verifyBarcodeTrace(process.cwd()), scope: 'emitted uncompressed trace; final deployed wrapper/package metadata remains separate' }));
