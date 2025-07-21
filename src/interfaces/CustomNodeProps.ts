import type { Position } from "@xyflow/react";
import type { IImage } from "./IImage";

export interface GraphicNodeData {
    images?: IImage[];
    description?: string;
    imageUrl?: string;
    received?: string;
}

export type CustomNodeProps<T> = {
    id: string;
    data: T;
    selected: boolean;
    dragging: boolean;
    sourcePosition?: Position;
    targetPosition?: Position;
    onOpenModal?: (images: IImage[], index: number) => void;
};
