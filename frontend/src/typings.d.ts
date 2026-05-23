declare module 'd3-org-chart' {
  export class OrgChart<T = any> {
    container(el: HTMLElement | string): this;
    data(data: T[]): this;
    nodeWidth(fn: (d: any) => number): this;
    nodeHeight(fn: (d: any) => number): this;
    compactMarginBetween(fn: (d: any) => number): this;
    compactMarginPair(fn: (d: any) => number): this;
    neighbourMargin(fn: (d: any) => number): this;
    childrenMargin(fn: (d: any) => number): this;
    nodeContent(fn: (d: any) => string): this;
    onNodeClick(fn: (id: string) => void): this;
    linkUpdate(fn: (d: any, i: number, arr: any[]) => void): this;
    render(): this;
    expandAll(): this;
    collapseAll(): this;
    fit(): this;
    zoomIn(): this;
    zoomOut(): this;
  }
}
