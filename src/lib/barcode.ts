import bwipjs from "bwip-js";

export async function generateBarcodeDataUrl(text: string): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text,
    scale: 3,
    height: 8, 
    includetext: false, 
    backgroundcolor: "FFFFFF",
    paddingwidth: 0,
    paddingheight: 0,
  });
  return `data:image/png;base64,${png.toString("base64")}`;
}
