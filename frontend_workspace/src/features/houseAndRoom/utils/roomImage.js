export function pickRepresentativeRoomImageName(source) {
  if (!source) return null;
  if (typeof source === 'string') return source;

  return (
    source.repImageName ||
    source.roomStoredImageName ||
    source.storedImageName ||
    source.imageName ||
    source.fileName ||
    source.roomImageName ||
    source.name ||
    null
  );
}

export function toRoomImageUrl(imageName) {
  if (!imageName) return null;
  if (String(imageName).startsWith('http')) return imageName;
  return `http://localhost:8080/upload/room_image/${imageName}`;
}
