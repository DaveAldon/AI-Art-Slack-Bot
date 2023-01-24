import Canvas from "@napi-rs/canvas";
import { App } from "@slack/bolt";
import dotenv from "dotenv";
import { callStableDiffusionService } from "./api/stableDiffusion";
import { ArtResponse } from "./types/ArtResponse";

dotenv.config();
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:7861";

const app = new App({
  appToken: SLACK_APP_TOKEN,
  token: SLACK_BOT_TOKEN,
  socketMode: true,
});

app.command("/art", async ({ body, ack }) => {
  await ack();
  const artResponseUnparsed = await callStableDiffusionService(
    BACKEND_URL,
    body.text,
    4
  );

  const { images } = JSON.parse(
    artResponseUnparsed.serverResponse
  ) as ArtResponse;

  const canvas = Canvas.createCanvas(512, 512);
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < 4; i++) {
    const image = images[i];
    const buffer = Buffer.from(image, "base64");
    const img = await Canvas.loadImage(buffer);
    i === 0 && ctx.drawImage(img, 0, 0, 256, 256);
    i === 1 && ctx.drawImage(img, 256, 0, 256, 256);
    i === 2 && ctx.drawImage(img, 0, 256, 256, 256);
    i === 3 && ctx.drawImage(img, 256, 256, 256, 256);
  }

  const image = await canvas.encode("png");

  app.client.files.upload({
    token: SLACK_BOT_TOKEN,
    channels: body.channel_id,
    file: image,
    filename: `${new Date().toISOString()}.png`,
    title: body.text,
  });
});

app.start().catch((error) => {
  console.error(error);
  process.exit(1);
});
