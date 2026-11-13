// Minimal uncompressed ZIP writer for the five XML parts of an XLSX workbook.
export const strToU8 = (text) => new TextEncoder().encode(text)
const table = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1
  return n >>> 0
})
const crc32 = (data) => {
  let crc = 0xffffffff
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
export function zipSync(files) {
  const chunks = [], directory = []
  let offset = 0, directorySize = 0
  for (const [path, data] of Object.entries(files)) {
    const name = strToU8(path), crc = crc32(data)
    const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer)
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(12, 33, true)
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true)
    header.set(name, 30)
    const central = new Uint8Array(46 + name.length), c = new DataView(central.buffer)
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(14, 33, true)
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true)
    central.set(name, 46)
    chunks.push(header, data); directory.push(central)
    offset += header.length + data.length; directorySize += central.length
  }
  const end = new Uint8Array(22), e = new DataView(end.buffer)
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, directory.length, true); e.setUint16(10, directory.length, true); e.setUint32(12, directorySize, true); e.setUint32(16, offset, true)
  const result = new Uint8Array(offset + directorySize + end.length)
  let cursor = 0
  for (const part of [...chunks, ...directory, end]) { result.set(part, cursor); cursor += part.length }
  return result
}
