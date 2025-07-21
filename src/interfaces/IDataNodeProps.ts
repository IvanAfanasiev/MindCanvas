import type { IMessage } from "./IMessage";
import type { DataRow } from "./IDataRow";
import type { NodeProps } from "@xyflow/react";

export interface IDataNodeProps extends NodeProps {
    rows: DataRow[];
    message: IMessage;
}
