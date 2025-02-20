import { RFNodeData } from "@/common/common-types";

export const getBoxHeight = (data: RFNodeData): number => {
  // height of box with single line minus lineHeight
  const lineBase = 33;
  // extra
  const extra = 60;
  // equal to lineheight huh
  const lineHeight = 23;
  // ~for width 600px
  const lineWidth = 72;

  // for single line
  if (!data.description)
    return lineBase + lineHeight;

  const numLines = data.description.length / lineWidth;

  return lineBase + extra + numLines * lineHeight;
}