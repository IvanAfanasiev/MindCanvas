import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";
import type { Connection, NodeProps } from "@xyflow/react";
import styles from "../../styles/DataNode.module.scss";
import buttonStyles from "../../styles/Buttons.module.scss";
import globalStyles from "../../styles/Global.module.scss";
import type { DataRow } from "../../interfaces/IDataRow";
import { deleteNodeById, handleNodeLog } from "../utils";

export default function DataNode({
    id,
    data,
}: NodeProps & {
    onConnect?: (connection: Connection) => void;
}) {
    const [rows, setRows] = useState<DataRow[]>([
        { id: crypto.randomUUID(), key: "", value: "" },
    ]);

    const reactFlow = useReactFlow();

    const handleChange = () => {
        const edges = reactFlow.getEdges();
        handleNodeLog(id, reactFlow, edges, rows);
    };
    useEffect(() => {
        handleChange();
    }, [rows]);

    const updateRow = (id: string, field: keyof DataRow, newValue: any) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: newValue } : row
            )
        );
    };

    const addRow = () => {
        setRows((prev) => [
            ...prev,
            { id: crypto.randomUUID(), key: "", value: "" },
        ]);
    };

    const removeRow = (id: string) => {
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    const setValue = (receiver: String) => {
        if (!receiver?.startsWith("input-")) return;
        const rowIndex = parseInt(receiver.split("-")[1]);
        updateRow(rows[rowIndex].id, "value", data.text);
        updateRow(rows[rowIndex].id, "fromNodeId", data.sender);
    };

    useEffect(() => {
        if (data.text !== undefined) {
            const receiver = data.receiver?.toString() ?? "";
            setValue(receiver);
        }
    }, [data.receiver, data.text]);

    const getSourceValue = (fromNodeId?: string) => {
        if (!fromNodeId) return undefined;
        const source = reactFlow.getNodes().find((n) => n.id === fromNodeId);
        return source?.data?.value ?? "";
    };

    useEffect(() => {
        data.rows = rows;
    }, [rows]);

    return (
        <div
            className={[styles.dataNode, globalStyles.node]
                .filter(Boolean)
                .join(" ")}
        >
            <div className={`nodeHeader ${globalStyles.nodeHeader}`}>
                Data Node
                <button
                    className={buttonStyles.deleteButton}
                    onClick={() => deleteNodeById(id, reactFlow)}
                >
                    ✕
                </button>
            </div>
            <div className={styles.wrapper}>
                <div className={styles.data}>
                    {rows.map((row, index) => {
                        const isConnected = !!row.fromNodeId;
                        const sourceValue = getSourceValue(row.fromNodeId);
                        return (
                            <div className={styles.row} key={row.id}>
                                <input
                                    className={styles.keyInput}
                                    placeholder="key"
                                    value={row.key}
                                    onChange={(e) =>
                                        updateRow(row.id, "key", e.target.value)
                                    }
                                />
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={`input-${index}`}
                                    style={{
                                        top: 55 + index * 32.5,
                                        opacity: row.key ? 1 : 0,
                                        pointerEvents: row.key
                                            ? "auto"
                                            : "none",
                                    }}
                                />
                                <input
                                    className={styles.valueInput}
                                    placeholder="value"
                                    value={
                                        isConnected
                                            ? String(sourceValue)
                                            : String(row.value)
                                    }
                                    onChange={(e) => {
                                        if (isConnected) return;

                                        let newValue: string | number =
                                            e.target.value;
                                        updateRow(row.id, "value", newValue);
                                    }}
                                    disabled={!row.key || isConnected}
                                />
                                <div className={styles.actions}>
                                    {index > 0 && (
                                        <button
                                            title="Remove"
                                            onClick={() => removeRow(row.id)}
                                            className={
                                                buttonStyles.deleteButton
                                            }
                                        >
                                            -
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={addRow} className={buttonStyles.addButton}>
                    +
                </button>
            </div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
