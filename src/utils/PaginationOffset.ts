export type OffsetEdgeInfo = {
    totalPageCount: number;
    totalRowCount: number;
    currentPageIndex: number;
    currentRowCount: number;
};

export type OffsetPageEdge<T> = {
    edgeInfo: OffsetEdgeInfo;
    data: T[];
};
