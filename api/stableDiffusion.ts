import { StableDiffusionTxt2ImgRequest } from "../types/StableDiffusionInputs";
import { Services } from "./urls.enum";

const REQUEST_TIMEOUT_SEC = 60000;

export const callStableDiffusionService = async (
  backendUrl: string,
  text: string,
  numImages: number
) => {
  const queryStartTime = new Date();

  const payload: StableDiffusionTxt2ImgRequest = {
    prompt: text,
    steps: 20,
    sampler_index: "Euler a",
    cfg_scale: 7,
    seed: -1,
    batch_size: numImages,
    //negative_prompt: negativePrompts,
  };

  const response = await Promise.race([
    (
      await fetch(`${backendUrl}${Services.txt2img}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).then((response: any) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      })
    ).text(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), REQUEST_TIMEOUT_SEC)
    ),
  ]);

  const executionTime = new Date().getTime() - queryStartTime.getTime();
  const serverResponse = response;

  return {
    executionTime,
    serverResponse,
  };
};
