export interface ITextNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
        text?: string;
        onChange?: (text: string) => void;
    };
    className?: string;
    selected?: boolean;
    dragging?: boolean;
    width?: number;
    height?: number;
}
