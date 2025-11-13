export interface ProductFieldDto {
  on_hand?: number;
  image_url?: string | null;
}

export interface ProductFieldModel {
  onHand: number;
  imageUrl: string | null;
}

export function mapProductFieldsFromDto<T extends ProductFieldDto | null | undefined>(
  dto: T,
): ProductFieldModel {
  const onHand =
    dto && typeof dto.on_hand === 'number' && Number.isFinite(dto.on_hand) ? dto.on_hand : 0;
  const imageUrl =
    dto && typeof dto.image_url === 'string' && dto.image_url.length > 0 ? dto.image_url : null;

  return {
    onHand,
    imageUrl,
  };
}

export function mapProductFieldsToDto<T extends ProductFieldModel | null | undefined>(
  model: T,
): ProductFieldDto {
  if (!model) {
    return { on_hand: 0, image_url: null };
  }

  const normalizedOnHand =
    typeof model.onHand === 'number' && Number.isFinite(model.onHand) ? Math.floor(model.onHand) : 0;

  return {
    on_hand: normalizedOnHand,
    image_url: model.imageUrl ?? null,
  };
}

