import { fileExtension } from './upload.controller';
describe('upload signature validation', () => {
  it('accepts known file signatures and rejects renamed executables', () => {
    expect(fileExtension(Buffer.from([137,80,78,71,13,10,26,10]))).toBe('.png');
    expect(fileExtension(Buffer.from('%PDF-1.7'))).toBe('.pdf');
    expect(fileExtension(Buffer.from('MZ executable'))).toBeNull();
  });
});
