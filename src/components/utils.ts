import { type Edge, type ReactFlowInstance } from "@xyflow/react";

export const handleNodeLog = (
    id: string,
    reactFlowInstance: ReactFlowInstance,
    edges: Edge[],
    newValue?: any
) => {
    if (!id) return;
    const sourceNode = reactFlowInstance.getNode(id);
    if (!sourceNode) return;

    const setEdgeData = () => {
        const connectedTargetEdges = edges.filter((e) => e.source === id);

        if (connectedTargetEdges.length === 0) return;
        connectedTargetEdges.forEach((edge) => {
            if (!edge.targetHandle) return;

            reactFlowInstance.updateNodeData(edge.target, {
                receiver: edge.targetHandle,
                sender: edge.source,
                text: newValue ?? sourceNode.data.value,
            });
        });
    };
    switch (sourceNode.type) {
        case "textNode":
            setEdgeData();
            break;

        case "dataNode":
            setEdgeData();
            break;

        case "graphicNode":
            setEdgeData();
            break;
        case "converterNode":
            setEdgeData();
            break;

        default:
            alert("Unknown node data:" + sourceNode.data);
    }
};
export const deleteNodeById = (
    id: string,
    reactFlowInstance: ReactFlowInstance
) => {
    reactFlowInstance.setNodes((nds) => nds.filter((node) => node.id !== id));
};

export const ConverterTypes = {
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Array: "array",
    Object: "object",
} as const;
export type ConverterTypes =
    (typeof ConverterTypes)[keyof typeof ConverterTypes];

type TypeConverter = {
    [sourceType in ConverterTypes]?: {
        [targetType in ConverterTypes]?: (value: any) => any;
    };
};

const typeConverters: TypeConverter = {
    // fromType: {
    //     toType
    // }
    array: {
        string: arrayToString,
        number: (value) => value.length,
        boolean: (value) => value.length > 0
    },
    string: { 
        number: (value) => value.length,
        boolean: (value) => value.trim().length > 0,
        array: (value) => value.split(",").map((v: string) => v.trim()),
    },
    object: {
        string: (value) => JSON.stringify(value),
    },
    number: {
        string: (value) => String(value),
        boolean: (value) => value !== 0,
    },
};

function arrayToString(value: unknown[]): string {
    if (!Array.isArray(value)) return "";

    if (value.length === 0) return "";

    const first = value[0];

    if (typeof first === "object" && first !== null) {
        if ("key" in first && "value" in first) {
            return value
                .filter((row: any) => row.key?.trim())
                .map((row: any) => `${row.key}: ${row.value}`)
                .join("\n");
        }

        if ("name" in first) {
            return value.map((item: any) => item.name).join(", ");
        }

        return JSON.stringify(value);
    }

    return value.map(String).join(", ");
}

function getType(value: any): ConverterTypes {
    if (Array.isArray(value)) return "array";
    if (value === null) return "object";
    return typeof value as ConverterTypes;
}

export function castValue(value: unknown, targetType: ConverterTypes): unknown {
    const sourceType = getType(value);
    const converter = typeConverters[sourceType]?.[targetType];
    return converter ? converter(value) : value;

}
