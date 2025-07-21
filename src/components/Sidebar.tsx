import { useState } from "react";
import styles from "../styles/Sidebar.module.scss";

export default function Sidebar() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <>
            <div
                className={`${styles.sidebar} ${
                    sidebarOpen ? styles.open : styles.closed
                }`}
            >
                <h3>Add an item</h3>
                <div
                    className={styles.nodeBox}
                    draggable
                    onDragStart={(e) => onDragStart(e, "textNode")}
                >
                    📝Note
                </div>
                <div
                    className={styles.nodeBox}
                    draggable
                    onDragStart={(e) => onDragStart(e, "graphicNode")}
                >
                    🖼Gallery
                </div>
                <div
                    className={styles.nodeBox}
                    draggable
                    onDragStart={(e) => onDragStart(e, "dataNode")}
                >
                    📖Data
                </div>
                <div
                    className={styles.nodeBox}
                    draggable
                    onDragStart={(e) => onDragStart(e, "converterNode")}
                >
                    ♻Converter
                </div>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? "<<" : ">>"}
            </button>
        </>
    );
}
