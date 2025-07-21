import { Handle, Position } from "@xyflow/react";
import { useEffect, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import styles from "../../styles/TextNode.module.scss";
import buttonStyles from "../../styles/Buttons.module.scss";
import globalStyles from "../../styles/Global.module.scss";
import { useReactFlow } from "@xyflow/react";
import { deleteNodeById, handleNodeLog } from "../utils";

export default function TextNode({ id, data }: NodeProps) {
    const [value, setValue] = useState(data.value?.toString() || "");
    const reactFlow = useReactFlow();
    const { getEdges } = useReactFlow();
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value ?? null;
        setValue(newValue);
        const edges = getEdges();
        handleNodeLog(id, reactFlow, edges, newValue);
    };

    useEffect(() => {
        setValue(data.text?.toString() ?? "");
    }, [data.receiver, data.text]);

    useEffect(() => {
        data.value = value;
    }, [value]);

    return (
        <>
            <div
                className={[styles.textNode, globalStyles.node]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className={`nodeHeader ${globalStyles.nodeHeader}`}>
                    Note
                    <button
                        className={buttonStyles.deleteButton}
                        onClick={() => deleteNodeById(id, reactFlow)}
                    >
                        ✕
                    </button>
                </div>
                <textarea
                    spellCheck={false}
                    className={styles.textArea}
                    value={value}
                    onChange={(e) => handleChange(e)}
                    placeholder="Enter the text..."
                />
            </div>
            <Handle type="target" position={Position.Left} id="input" />
            <Handle type="source" position={Position.Right} id="output" />
        </>
    );
}
