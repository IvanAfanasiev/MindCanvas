import { Handle, Position } from "@xyflow/react";
import { useEffect, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import styles from "../../styles/ConverterNode.module.scss";
import globalStyles from "../../styles/Global.module.scss";
import buttonStyles from "../../styles/Buttons.module.scss";
import { useReactFlow } from "@xyflow/react";
import {
    deleteNodeById,
    castValue,
    ConverterTypes,
    handleNodeLog,
} from "../utils";

export default function ConverterNode({ id, data }: NodeProps) {
    const [value, setValue] = useState(data.value?.toString() || "");
    const [type, setType] = useState<ConverterTypes>(ConverterTypes.String);
    const reactFlow = useReactFlow();

    useEffect(() => {
        updateData(data.text, type);
    }, [data.receiver, data.text]);

    const updateData = (newValue: any, type: ConverterTypes) => {
        const converted = castValue(newValue, type);
        const val = converted;
        setValue(val?.toString() ?? "");
    };

    const updateType = (newType: ConverterTypes) => {
        updateData(data.text, newType);
        setType(newType);
    };

    const handleChange = () => {
        const edges = reactFlow.getEdges();
        handleNodeLog(id, reactFlow, edges, value);
    };
    useEffect(() => {
        handleChange();
        data.value = value;
    }, [value]);

    return (
        <>
            <div
                className={[styles.converterNode, globalStyles.node]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className={`nodeHeader ${globalStyles.nodeHeader}`}>
                    Converter
                    <button
                        className={buttonStyles.deleteButton}
                        onClick={() => deleteNodeById(id, reactFlow)}
                    >
                        ✕
                    </button>
                </div>
                <div className={styles.types}>
                    <select
                        value={type}
                        onChange={(e) =>
                            updateType(e.target.value as ConverterTypes)
                        }
                    >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                    </select>
                </div>
                <div className={styles.data}>{value}</div>
            </div>
            <Handle type="target" position={Position.Left} id="input" />
            <Handle type="source" position={Position.Right} id="output" />
        </>
    );
}
