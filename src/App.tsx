import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import styles from "./styles/App.module.scss";
import modalStyles from "./styles/ModalStyles.module.scss";
import "@xyflow/react/dist/style.css";
import {
    ReactFlow,
    Background,
    Controls,
    addEdge,
    reconnectEdge,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    type Node,
    type Edge,
    type Connection,
    useReactFlow,
} from "@xyflow/react";

import Modal from "react-modal";
import Sidebar from "./components/Sidebar";
import TextNode from "./components/nodes/TextNode";
import DataNode from "./components/nodes/DataNode";
import GraphicNode from "./components/nodes/GraphicNode";
import ConverterNode from "./components/nodes/ConverterNode";
import type { IImage } from "./interfaces/IImage";
import { CustomEdge } from "./components/CustomEdge";
import { handleNodeLog } from "./components/utils";
import type {
    CustomNodeProps,
    GraphicNodeData,
} from "./interfaces/CustomNodeProps";

Modal.setAppElement("#root");

let id = 0;
const getId = () => `node_${id++}`;

function FlowCanvas({
    onOpenModal,
}: {
    onOpenModal: (images: IImage[], index: number) => void;
}) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const undoStack = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
    const redoStack = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

    const pushToHistory = (nodesSnapshot: Node[], edgesSnapshot: Edge[]) => {
        undoStack.current.push({
            nodes: [...nodesSnapshot],
            edges: [...edgesSnapshot],
        });
        if (undoStack.current.length > 10) {
            undoStack.current.shift();
        }
        redoStack.current = [];
    };

    const undo = () => {
        if (undoStack.current.length === 0) return;

        const last = undoStack.current.pop();
        redoStack.current.push({ nodes, edges });

        if (last) {
            setNodes(last.nodes);
            setEdges(last.edges);
        }
    };

    const redo = () => {
        if (redoStack.current.length === 0) return;

        const next = redoStack.current.pop();
        undoStack.current.push({ nodes, edges });

        if (next) {
            setNodes(next.nodes);
            setEdges(next.edges);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                redo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nodes, edges]);

    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    const { screenToFlowPosition, getNodes } = useReactFlow();

    const reactFlow = useReactFlow();

    const edgeReconnectSuccessful = useRef(true);
    const connectionRef = useRef<Connection | Edge | null>(null);

    const nodeTypes = useMemo(
        () => ({
            textNode: TextNode,
            graphicNode: (props: CustomNodeProps<GraphicNodeData>) => (
                <GraphicNode {...props} onOpenModal={onOpenModal} />
            ),
            dataNode: DataNode,
            converterNode: ConverterNode,
        }),
        [onOpenModal]
    );

    const edgeTypes = {
        custom: CustomEdge,
    };

    const onConnect = useCallback(
        (connection: Edge | Connection) => {
            connectionRef.current = connection;
            setEdges((eds) => {
                const filtered = eds.filter(
                    (e) =>
                        e.target !== connection.target ||
                        e.targetHandle !== connection.targetHandle
                );
                pushToHistory(nodes, eds);
                const newEdges = addEdge({ ...connection }, filtered);
                return newEdges;
            });
        },
        [setEdges]
    );

    useEffect(() => {
        if (connectionRef.current) {
            const connection = connectionRef.current;
            handleNodeLog(connection.source, reactFlow, edges);
            connectionRef.current = null;
        }
    }, [edges]);

    const onReconnect = useCallback(
        (oldEdge: Edge, newConnection: Connection) => {
            connectionRef.current = newConnection;
            edgeReconnectSuccessful.current = true;
            setEdges((eds) => {
                pushToHistory(nodes, eds);
                return reconnectEdge(oldEdge, newConnection, eds);
            });
        },
        [setEdges]
    );
    const onReconnectStart = useCallback(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnectEnd = useCallback((_: any, edge: { id: string }) => {
        if (!edgeReconnectSuccessful.current) {
            setEdges((eds) => {
                pushToHistory(nodes, eds);
                return eds.filter((e) => e.id !== edge.id);
            });
        }
        edgeReconnectSuccessful.current = true;
    }, []);

    const allowedConnections: Record<string, string[]> = {
        //source: [targets]
        textNode: ["dataNode", "converterNode"],
        graphicNode: ["converterNode"],
        dataNode: ["converterNode"],
        converterNode: ["dataNode", "textNode"],
    };

    const validateConnection = useCallback(
        (connection: Edge | Connection): boolean => {
            const sourceNode = getNodes().find(
                (n) => n.id === connection.source
            );
            const targetNode = getNodes().find(
                (n) => n.id === connection.target
            );
            if (
                !sourceNode?.type ||
                !targetNode?.type ||
                !connection.targetHandle
            ) {
                return false;
            }
            const allowedTargets = allowedConnections[sourceNode.type];
            if (!allowedTargets) return false;

            return allowedTargets.includes(targetNode.type);
        },
        [getNodes]
    );

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData("application/reactflow");
            if (!type) return;
            if (!reactFlowWrapper.current || !reactFlowInstance) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            let newData;
            switch (type) {
                case "textNode":
                    newData = { value: "" };
                    break;
                case "graphicNode":
                    newData = {
                        images: [],
                        description: "",
                        imageUrl: "",
                        received: "",
                    };

                    break;
                case "dataNode":
                    newData = { rows: [], message: {} };
                    break;
                default:
                    newData = { value: "" };
            }
            const newNode: Node = {
                id: getId(),
                type,
                position,
                dragHandle: ".nodeHeader",
                data: newData,
            };

            setNodes((nds) => {
                pushToHistory(nds, edges);
                return nds.concat(newNode);
            });
        },
        [reactFlowInstance, screenToFlowPosition, setNodes]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    return (
        <div className={styles.app}>
            <Sidebar />
            <div
                className={`${styles.canvas} react-flow`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                ref={reactFlowWrapper}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDragStart={() => {
                        pushToHistory(nodes, edges);
                    }}
                    onConnect={onConnect}
                    onReconnectStart={onReconnectStart}
                    onReconnect={onReconnect}
                    onReconnectEnd={onReconnectEnd}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    edgesReconnectable={true}
                    defaultEdgeOptions={{
                        reconnectable: "target",
                    }}
                    isValidConnection={validateConnection}
                    onInit={setReactFlowInstance}
                >
                    <Background
                        gap={16}
                        size={1}
                        style={{ pointerEvents: "none" }}
                    />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}

export default function App() {
    const [modalData, setModalData] = useState<{
        images: IImage[];
        currentIndex: number;
    } | null>(null);

    const openModal = (images: IImage[], index: number) => {
        setModalData({ images, currentIndex: index });
    };

    const closeModal = () => {
        setModalData(null);
    };

    const nextImage = () => {
        if (!modalData) return;
        setModalData({
            ...modalData,
            currentIndex:
                (modalData.currentIndex + 1) % modalData.images.length,
        });
    };

    const prevImage = () => {
        if (!modalData) return;
        setModalData({
            ...modalData,
            currentIndex:
                (modalData.currentIndex - 1 + modalData.images.length) %
                modalData.images.length,
        });
    };

    return (
        <>
            <Modal
                isOpen={!!modalData}
                onRequestClose={closeModal}
                contentLabel="Image viewer"
                overlayClassName={modalStyles.reactModalOverlay}
                className={modalStyles.reactModalContent}
            >
                {modalData && (
                    <div className={modalStyles.imageContainer}>
                        <div className={modalStyles.wrapper}>
                            <img
                                src={
                                    modalData.images[modalData.currentIndex].src
                                }
                                alt={`Preview ${modalData.currentIndex}`}
                            />
                        </div>

                        <button
                            className={`${modalStyles.navButton} ${modalStyles.leftButton}`}
                            onClick={prevImage}
                            style={{
                                display:
                                    modalData.images.length > 1
                                        ? "flex"
                                        : "none",
                            }}
                        >
                            ‹
                        </button>
                        <button
                            className={`${modalStyles.navButton} ${modalStyles.rightButton}`}
                            onClick={nextImage}
                            style={{
                                display:
                                    modalData.images.length > 1
                                        ? "flex"
                                        : "none",
                            }}
                        >
                            ›
                        </button>
                        <button
                            className={modalStyles.closeButton}
                            onClick={closeModal}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </Modal>
            <ReactFlowProvider>
                <FlowCanvas onOpenModal={openModal} />
            </ReactFlowProvider>
        </>
    );
}
