import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useState, useRef, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";
import styles from "../../styles/GraphicNode.module.scss";
import buttonStyles from "../../styles/Buttons.module.scss";
import globalStyles from "../../styles/Global.module.scss";
import type { IImage } from "../../interfaces/IImage";
import type {
    CustomNodeProps,
    GraphicNodeData,
} from "../../interfaces/CustomNodeProps";
import { deleteNodeById, handleNodeLog } from "../utils";

export default function GraphicNode({
    id,
    data,
    onOpenModal,
}: CustomNodeProps<GraphicNodeData>) {
    const [images, setImages] = useState<IImage[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const reactFlow = useReactFlow();

    useEffect(() => {
        if (data.images && data.images.length > 0) {
            setImages(data.images);
        }
    }, []);
    useEffect(() => {
        handleChange();
        data.images = images;
    }, [images]);

    const handleChange = () => {
        const edges = reactFlow.getEdges();
        console.log(images);
        handleNodeLog(id, reactFlow, edges, images);
    };

    const handleFile = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => {
                const src = reader.result as string;
                addImage(src, file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const addImage = (src: string, name: string) => {
        setImages((prev) => [...prev, { id: crypto.randomUUID(), src, name }]);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const openImagePreview = (index: number) => {
        onOpenModal?.(images, index);
    };

    return (
        <>
            <div
                className={[styles.graphicNode, globalStyles.node]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className={`nodeHeader ${globalStyles.nodeHeader}`}>
                    Gallery
                    <button
                        className={buttonStyles.deleteButton}
                        onClick={() => deleteNodeById(id, reactFlow)}
                    >
                        ✕
                    </button>
                </div>

                <div
                    className={styles.dropArea}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                >
                    {images.length > 0 && (
                        <>
                            <ReactSortable
                                list={images}
                                setList={setImages}
                                className={styles.gallery}
                                animation={150}
                            >
                                {images.map((img, indx) => (
                                    <div
                                        key={img.id}
                                        className={styles.imageWrapper}
                                    >
                                        <img
                                            src={img.src}
                                            alt="img"
                                            className={styles.image}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openImagePreview(indx);
                                            }}
                                        />
                                        <button
                                            className={styles.removeButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(indx);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </ReactSortable>
                        </>
                    )}
                    <div
                        className={styles.addnew}
                        onClick={(e) => {
                            if (
                                (
                                    e.target as HTMLElement
                                ).tagName.toLowerCase() === "img"
                            )
                                return;
                            fileInputRef.current?.click();
                        }}
                    >
                        <div className={styles.plusbtn}>+</div>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={onChange}
                        style={{ display: "none" }}
                    />
                </div>
            </div>
            <Handle type="source" position={Position.Right} />
        </>
    );
}
