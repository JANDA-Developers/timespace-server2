type StageType =
    | "$project"
    | "$addFields"
    | "$match"
    | "$unwind"
    | "$group"
    | "$sort"
    | "$out"
    | "$count"
    | "$lookup"
    | "$limit"
    | "$facet"
    | "$skip"
    | "$replaceRoot";

export type Stage = {
    [K in StageType]?: any;
};
